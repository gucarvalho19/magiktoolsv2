import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
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
 *
 * VERSÃO TEMPORÁRIA SEM VALIDAÇÃO SVIX
 * Para debug - identificar se o problema é o import do svix
 *
 * TODO: Adicionar validação Svix após confirmar que endpoint registra
 */
export const webhookClerk = api.raw(
  { method: "POST", path: "/webhooks/clerk", expose: true },
  async (req, res) => {
    try {
      log.info("Webhook Clerk endpoint foi chamado!");

      // Ler o corpo da requisição
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString("utf-8");

      // Parse do payload
      let evt: ClerkWebhookEvent;
      try {
        evt = JSON.parse(rawBody) as ClerkWebhookEvent;
      } catch (err) {
        log.error("Erro ao fazer parse do JSON", { error: err });
        res.statusCode = 400;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }

      const eventType = evt.type;
      const userId = evt.data.id;

      log.info("Webhook Clerk recebido", {
        eventType,
        userId,
        userEmail: evt.data.email_addresses?.[0]?.email_address,
      });

      // Processar o evento
      switch (eventType) {
        case "user.deleted":
          await handleUserDeleted(userId);
          break;

        case "user.created":
          log.info("Usuário criado no Clerk", { userId });
          break;

        case "user.updated":
          log.info("Usuário atualizado no Clerk", { userId });
          break;

        default:
          log.info("Evento Clerk não tratado", { eventType, userId });
      }

      log.info("Webhook processado com sucesso", { eventType, userId });

      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ status: "ok" }));
    } catch (err) {
      const errorDetails = err instanceof Error
        ? { message: err.message, stack: err.stack, name: err.name }
        : { error: String(err) };
      log.error("Erro ao processar webhook Clerk", errorDetails);

      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({
        status: "error",
        message: "Internal server error - webhook will be retried"
      }));
    }
  }
);

/**
 * Handler para evento user.deleted
 */
async function handleUserDeleted(userId: string) {
  log.info("Processando deleção de usuário", { userId });

  const tx = await db.begin();

  try {
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

    await tx.exec`
      UPDATE memberships
      SET user_id = NULL,
          status = 'canceled',
          deactivated_at = NOW(),
          updated_at = NOW()
      WHERE id = ${membership.id}
    `;

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
 * Endpoint de debug
 */
export const webhookClerkDebug = api(
  { method: "GET", path: "/webhooks/clerk/_debug", expose: true },
  async () => {
    return {
      ok: true,
      route: "/webhooks/clerk",
      method: "POST",
      message: "Webhook endpoint is configured (WITHOUT Svix validation - temporary)",
      warning: "This version does NOT validate Svix signatures - FOR DEBUG ONLY"
    };
  }
);
