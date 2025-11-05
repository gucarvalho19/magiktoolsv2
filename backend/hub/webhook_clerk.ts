import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { Webhook } from "svix";
import db from "../db";
import log from "encore.dev/log";
import { promoteNextInWaitlist } from "./memberships/promote";

// Clerk webhook signing secret
const clerkWebhookSecret = secret("ClerkWebhookSecret");

// Clerk webhook event types
interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    created_at?: number;
    updated_at?: number;
    public_metadata?: Record<string, any>;
    deleted?: boolean;
  };
  object: string;
}

/**
 * Webhook endpoint para receber eventos do Clerk
 * Eventos suportados:
 * - user.created: Usuário criado no Clerk
 * - user.updated: Usuário atualizado no Clerk
 * - user.deleted: Usuário deletado no Clerk (PRINCIPAL CASO DE USO)
 *
 * Endpoint: POST /webhooks/clerk
 *
 * Configuração no Clerk Dashboard:
 * 1. Acesse https://dashboard.clerk.com
 * 2. Navegue até "Webhooks" no menu lateral
 * 3. Clique em "Add Endpoint"
 * 4. Configure a URL: https://seu-dominio.com/webhooks/clerk
 * 5. Selecione os eventos: user.deleted (obrigatório), user.created, user.updated (opcionais)
 * 6. Copie o "Signing Secret" e configure via: encore secret set --type dev ClerkWebhookSecret
 */
export const webhookClerk = api.raw(
  { method: "POST", path: "/webhooks/clerk", expose: true },
  async (req, res) => {
    try {
      // Capturar headers necessários para validação Svix
      const svixId = req.headers["svix-id"] as string;
      const svixTimestamp = req.headers["svix-timestamp"] as string;
      const svixSignature = req.headers["svix-signature"] as string;

      // Validar headers obrigatórios
      if (!svixId || !svixTimestamp || !svixSignature) {
        log.warn("Webhook Clerk sem headers Svix necessários", {
          hasSvixId: !!svixId,
          hasSvixTimestamp: !!svixTimestamp,
          hasSvixSignature: !!svixSignature,
        });
        res.statusCode = 400;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "Missing Svix headers" }));
        return;
      }

      // Ler o corpo da requisição
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString("utf-8");

      // Validar assinatura usando Svix
      const wh = new Webhook(clerkWebhookSecret());
      let evt: ClerkWebhookEvent;

      try {
        evt = wh.verify(rawBody, {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature,
        }) as ClerkWebhookEvent;
      } catch (err) {
        log.warn("Assinatura inválida do webhook Clerk", {
          error: err instanceof Error ? err.message : String(err),
        });
        res.statusCode = 400;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "Invalid signature" }));
        return;
      }

      // Processar evento baseado no tipo
      const eventType = evt.type;
      const userId = evt.data.id;

      log.info("Webhook Clerk recebido", {
        eventType,
        userId,
        userEmail: evt.data.email_addresses?.[0]?.email_address,
      });

      switch (eventType) {
        case "user.deleted":
          await handleUserDeleted(userId);
          break;

        case "user.created":
          log.info("Usuário criado no Clerk", { userId });
          // Não há ação necessária - usuário será vinculado quando fizer claim
          break;

        case "user.updated":
          log.info("Usuário atualizado no Clerk", { userId });
          // Não há ação necessária - metadata é atualizada via API quando necessário
          break;

        default:
          log.info("Evento Clerk não tratado", { eventType, userId });
      }

      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ status: "ok" }));
    } catch (err) {
      const errorDetails = err instanceof Error
        ? { message: err.message, stack: err.stack, name: err.name }
        : { error: String(err) };
      log.error("Erro no webhook Clerk", errorDetails);

      // Retornar 200 para evitar retry infinito do Clerk
      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ status: "error", message: "Internal error" }));
    }
  }
);

/**
 * Handler para evento user.deleted
 *
 * Quando um usuário é deletado no Clerk Dashboard:
 * 1. Encontra a membership vinculada ao user_id
 * 2. Desvincula o user_id da membership (seta como NULL)
 * 3. Mantém o histórico de compra intacto (membership permanece)
 * 4. Se o usuário estava ativo, promove próximo da waitlist
 * 5. Registra ação de auditoria
 *
 * IMPORTANTE: Não deletamos a membership do banco de dados!
 * Apenas desvinculamos o usuário do Clerk, mantendo o registro de compra.
 * Isso permite:
 * - Manter histórico de transações
 * - Permitir que o usuário reclame novamente se criar nova conta
 * - Auditoria completa de ações
 */
async function handleUserDeleted(userId: string) {
  log.info("Processando deleção de usuário", { userId });

  const tx = await db.begin();

  try {
    // Buscar membership vinculada ao usuário
    const membership = await tx.queryRow<{
      id: number;
      status: string;
      email: string;
      kiwify_order_id: string;
    }>`
      SELECT id, status, email, kiwify_order_id
      FROM memberships
      WHERE user_id = ${userId}
      FOR UPDATE
    `;

    if (!membership) {
      await tx.rollback();
      log.info("Nenhuma membership encontrada para usuário deletado", { userId });
      return;
    }

    const wasActive = membership.status === "active";

    // Desvincular usuário da membership (não deletar a membership!)
    // Mantém o histórico de compra mas remove a vinculação ao Clerk
    await tx.exec`
      UPDATE memberships
      SET user_id = NULL,
          status = 'canceled',
          deactivated_at = NOW(),
          updated_at = NOW()
      WHERE id = ${membership.id}
    `;

    // Registrar ação de auditoria
    await tx.exec`
      INSERT INTO admin_actions (
        admin_user_id,
        action_type,
        target_membership_id,
        target_user_id,
        reason,
        metadata,
        created_at
      )
      VALUES (
        'system',
        'user_deleted_webhook',
        ${membership.id},
        ${userId},
        'User deleted from Clerk dashboard',
        ${JSON.stringify({
          event: "user.deleted",
          previousStatus: membership.status,
          email: membership.email,
          kiwifyOrderId: membership.kiwify_order_id,
        })},
        NOW()
      )
    `;

    await tx.commit();

    log.info("Usuário desvinculado da membership", {
      userId,
      membershipId: membership.id,
      email: membership.email,
      previousStatus: membership.status,
      wasActive,
    });

    // Se o usuário estava ativo, promover próximo da waitlist
    if (wasActive) {
      log.info("Promovendo próximo da waitlist após deleção de usuário ativo", {
        userId,
        membershipId: membership.id,
      });
      await promoteNextInWaitlist();
    }
  } catch (err) {
    await tx.rollback();
    const errorDetails = err instanceof Error
      ? { message: err.message, stack: err.stack, name: err.name }
      : { error: String(err) };
    log.error("Erro ao processar user.deleted", { userId, ...errorDetails });
    throw err;
  }
}

/**
 * Endpoint de debug para testar configuração do webhook
 * Retorna informações sobre a rota e configuração
 */
export const webhookClerkDebug = api(
  { method: "GET", path: "/webhooks/clerk/_debug", expose: true },
  async () => {
    return {
      ok: true,
      route: "/webhooks/clerk",
      method: "POST",
      requiredHeaders: ["svix-id", "svix-timestamp", "svix-signature"],
      supportedEvents: ["user.deleted", "user.created", "user.updated"],
      message: "Webhook endpoint is configured correctly",
    };
  }
);
