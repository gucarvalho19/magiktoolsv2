import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createHmac } from "crypto";
import db from "../db";
import log from "encore.dev/log";
import { promoteNextInWaitlist } from "./memberships/promote";
import { createClerkClient } from "@clerk/backend";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

const kiwifySecret = secret("KiwifySecret");
const debug = process.env.DEBUG_KIWIFY_WEBHOOK === "true";
const HUB_CAP = 20;

interface KiwifyOrderData {
  webhook_event_type: string;
  order_id: string;
  order_ref?: string;
  order_status?: string;
  payment_method?: string;
  store_id?: string;
  approved_date?: string;
  created_at?: string;
  updated_at?: string;
  product_type?: string;
  subscription_id?: string;
  Product?: {
    product_id?: string;
    product_name?: string;
  };
  Customer?: {
    full_name?: string;
    first_name?: string;
    email?: string;
    mobile?: string;
    CPF?: string;
    ip?: string;
    country?: string;
  };
  Subscription?: {
    start_date?: string;
    next_payment?: string;
    status?: string;
    customer_access?: {
      has_access?: boolean;
      active_period?: boolean;
      access_until?: string;
    };
    plan?: {
      id?: string;
      name?: string;
      frequency?: string;
      qty_charges?: number;
    };
  };
  subscription_status?: string;
}

interface KiwifyWebhookPayload {
  // Formato com wrapper (formato real enviado pela Kiwify)
  url?: string;
  signature?: string;
  order?: KiwifyOrderData;

  // Formato direto (formato da documentação, mantido para compatibilidade)
  webhook_event_type?: string;
  order_id?: string;
  order_ref?: string;
  order_status?: string;
  payment_method?: string;
  store_id?: string;
  approved_date?: string;
  created_at?: string;
  updated_at?: string;
  product_type?: string;
  subscription_id?: string;
  Product?: {
    product_id?: string;
    product_name?: string;
  };
  Customer?: {
    full_name?: string;
    first_name?: string;
    email?: string;
    mobile?: string;
    CPF?: string;
    ip?: string;
    country?: string;
  };
  Subscription?: {
    start_date?: string;
    next_payment?: string;
    status?: string;
    customer_access?: {
      has_access?: boolean;
      active_period?: boolean;
      access_until?: string;
    };
    plan?: {
      id?: string;
      name?: string;
      frequency?: string;
      qty_charges?: number;
    };
  };
  subscription_status?: string;
}

export const webhookKiwify = api.raw(
  { method: "POST", path: "/webhooks/kiwify", expose: true },
  async (req, res) => {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const signature = url.searchParams.get("signature") ?? "";

      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString("utf-8");

      if (debug) {
        console.log("Kiwify headers:", req.headers);
        console.log("Kiwify raw body (first 500):", rawBody.slice(0, 500));
      }

      const calcSignature = createHmac("sha1", kiwifySecret())
        .update(rawBody)
        .digest("hex");

      if (!signature || signature !== calcSignature) {
        log.warn("Assinatura inválida do webhook Kiwify", { signature, calcSignature });
        res.statusCode = 400;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "Incorrect signature" }));
        return;
      }

      const payload: KiwifyWebhookPayload = JSON.parse(rawBody);

      // Extrair dados do formato correto (wrapper.order ou direto no root)
      const orderData: KiwifyOrderData = payload.order
        ? payload.order
        : payload as KiwifyOrderData;

      const eventType = orderData.webhook_event_type;
      const orderId = orderData.order_id;
      const email = orderData.Customer?.email ?? "";

      // Validação de campos obrigatórios
      if (!eventType) {
        log.error("Webhook sem webhook_event_type", { payload });
        res.statusCode = 400;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "Missing webhook_event_type" }));
        return;
      }

      if (!orderId) {
        log.error("Webhook sem order_id", { eventType, payload });
        res.statusCode = 400;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "Missing order_id" }));
        return;
      }

      log.info("Webhook Kiwify recebido", {
        eventType,
        orderId,
        orderStatus: orderData.order_status,
        email,
      });

      switch (eventType) {
        case "order_approved":
          await handleOrderApproved(orderId, email, orderData);
          break;

        case "order_rejected":
          await handleOrderRejected(orderId, email, orderData);
          break;

        case "subscription_renewed":
          await handleSubscriptionRenewed(orderId);
          break;

        case "subscription_late":
          await handleSubscriptionLate(orderId);
          break;

        case "subscription_canceled":
          await handleSubscriptionCanceled(orderId);
          break;

        case "order_refunded":
          await handleOrderRefunded(orderId);
          break;

        case "chargeback":
          await handleChargeback(orderId);
          break;

        case "pix_created":
        case "billet_created":
          log.info("Evento ignorado (aguardando pagamento)", { eventType, orderId });
          break;

        default:
          log.info("Evento não tratado", { eventType, orderId });
      }

      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ status: "ok" }));
    } catch (err) {
      const errorDetails = err instanceof Error
        ? { message: err.message, stack: err.stack, name: err.name, ...err }
        : { error: String(err) };
      log.error("Erro no webhook Kiwify", errorDetails);
      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ status: "ok" }));
    }
  }
);

async function handleOrderApproved(orderId: string, email: string, payload: KiwifyOrderData) {
  if (payload.order_status !== 'paid') {
    log.info("order_approved mas order_status != paid, ignorando", { orderId, orderStatus: payload.order_status });
    return;
  }

  log.info("Iniciando processamento de order_approved", { orderId, email });

  const tx = await db.begin();

  try {
    log.info("Verificando idempotência", { orderId });
    const existing = await tx.queryRow<{ id: number }>`
      SELECT id FROM memberships WHERE kiwify_order_id = ${orderId}
    `;

    if (existing) {
      await tx.rollback();
      log.info("Pedido já processado (idempotência)", { orderId });
      return;
    }

    log.info("Contando memberships ativos", { orderId });
    const activeCount = await tx.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM memberships WHERE status = 'active'
    `;

    const count = activeCount?.count ?? 0;
    const hasVacancy = count < HUB_CAP;
    const status = hasVacancy ? 'active' : 'waitlisted';

    // Use order_ref as claim code (same as Kiwify order reference)
    const claimCode = payload.order_ref || orderId;

    // Extract CPF if available (remove formatting)
    const cpf = payload.Customer?.CPF?.replace(/\D/g, '') || null;

    log.info("Preparando inserção", {
      orderId,
      email,
      status,
      claimCode,
      hasCpf: !!cpf,
      activeCount: count,
      hasVacancy
    });

    log.info("Executando INSERT INTO memberships", {
      orderId,
      email,
      kiwifyOrderId: orderId,
      status,
      claimCode,
      cpf: cpf || "NULL",
      hasVacancy: String(hasVacancy)
    });

    let result;
    try {
      result = await tx.queryRow<{ id: number }>`
        INSERT INTO memberships (
          email,
          kiwify_order_id,
          status,
          claim_code,
          customer_cpf,
          activated_at,
          purchased_at
        )
        VALUES (
          ${email},
          ${orderId},
          ${status},
          ${claimCode},
          ${cpf},
          CASE WHEN ${hasVacancy} THEN NOW() ELSE NULL END,
          NOW()
        )
        RETURNING id
      `;
    } catch (insertErr) {
      // Log insert error with all available details
      const insertErrObj = insertErr as any;
      log.error("FALHA NO INSERT", {
        orderId,
        errorString: String(insertErr),
        errorName: insertErrObj?.name,
        errorMessage: insertErrObj?.message,
        errorCode: insertErrObj?.code,
        errorDetail: insertErrObj?.detail,
        errorConstraint: insertErrObj?.constraint,
        errorTable: insertErrObj?.table,
        errorColumn: insertErrObj?.column,
        errorSchema: insertErrObj?.schema,
        insertValues: {
          email,
          orderId,
          status,
          claimCode,
          cpf: cpf ? "***" : null
        }
      });
      throw insertErr;
    }

    log.info("Membership inserida com sucesso", { orderId, membershipId: result?.id });

    await tx.commit();
    log.info("Transação commitada", { orderId });

    log.info("Pedido aprovado processado", {
      orderId,
      email,
      status,
      claimCode,
      cpf: cpf ? '***' : null,
      activeCount: count,
      cap: HUB_CAP,
      membershipId: result?.id
    });

    // TODO: Send email with claim code
    // await sendClaimCodeEmail(email, claimCode, status);
  } catch (err) {
    await tx.rollback();

    // Log full error to console for debugging (won't be truncated)
    console.error("=== FULL ERROR DETAILS ===");
    console.error("Error object:", err);
    console.error("Error string:", String(err));
    console.error("Error JSON:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));

    // Extract detailed error information
    let errorDetails: any = { error: String(err) };

    if (err instanceof Error) {
      errorDetails = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };

      // Try to extract additional properties from the error object
      const errObj = err as any;
      if (errObj.cause) {
        errorDetails.cause = JSON.stringify(errObj.cause, null, 2);
      }
      if (errObj.code) {
        errorDetails.dbCode = errObj.code;
      }
      if (errObj.detail) {
        errorDetails.detail = errObj.detail;
      }
      if (errObj.constraint) {
        errorDetails.constraint = errObj.constraint;
      }
      if (errObj.table) {
        errorDetails.table = errObj.table;
      }
      if (errObj.column) {
        errorDetails.column = errObj.column;
      }
    }

    log.error("Erro ao processar order_approved", {
      orderId,
      email,
      ...errorDetails
    });
    throw err;
  }
}

async function handleOrderRejected(orderId: string, email: string, payload: KiwifyOrderData) {
  log.info("Pedido recusado", {
    orderId,
    email,
    orderStatus: payload.order_status,
    paymentMethod: payload.payment_method
  });
  // Não criamos registro na tabela memberships para pedidos recusados
  // Apenas registramos o evento para auditoria
}

async function handleSubscriptionRenewed(orderId: string) {
  const tx = await db.begin();

  try {
    const membership = await tx.queryRow<{ id: number; status: string; user_id: string | null }>`
      SELECT id, status, user_id FROM memberships WHERE kiwify_order_id = ${orderId}
    `;

    if (!membership) {
      await tx.rollback();
      log.warn("Renovação para pedido inexistente", { orderId });
      return;
    }

    if (membership.status === 'past_due') {
      const activeCount = await tx.queryRow<{ count: number }>`
        SELECT COUNT(*) as count FROM memberships WHERE status = 'active'
      `;

      const count = activeCount?.count ?? 0;
      let newStatus = 'waitlisted';

      if (count < HUB_CAP) {
        await tx.exec`
          UPDATE memberships
          SET status = 'active',
              activated_at = NOW(),
              updated_at = NOW()
          WHERE id = ${membership.id}
        `;
        newStatus = 'active';
        log.info("Assinatura reativada após renovação", { orderId, membershipId: membership.id });
      } else {
        await tx.exec`
          UPDATE memberships
          SET status = 'waitlisted',
              deactivated_at = NOW(),
              updated_at = NOW()
          WHERE id = ${membership.id}
        `;
        log.info("Renovação processada mas sem vaga, movido para waitlist", { orderId });
      }

      await tx.commit();

      if (membership.user_id) {
        try {
          await clerkClient.users.updateUserMetadata(membership.user_id, {
            publicMetadata: { hubStatus: newStatus }
          });
        } catch (err) {
          log.error("Falha ao atualizar Clerk metadata após renovação", { userId: membership.user_id, error: err });
        }
      }
    } else {
      await tx.commit();
    }
  } catch (err) {
    await tx.rollback();
    const errorDetails = err instanceof Error
      ? { message: err.message, stack: err.stack, name: err.name, ...err }
      : { error: String(err) };
    log.error("Erro ao processar subscription_renewed", { orderId, ...errorDetails });
    throw err;
  }
}

async function handleSubscriptionLate(orderId: string) {
  const tx = await db.begin();

  try {
    const membership = await tx.queryRow<{ id: number; status: string; user_id: string | null }>`
      SELECT id, status, user_id FROM memberships WHERE kiwify_order_id = ${orderId} FOR UPDATE
    `;

    if (!membership) {
      await tx.rollback();
      log.warn("Assinatura atrasada para pedido inexistente", { orderId });
      return;
    }

    await tx.exec`
      UPDATE memberships
      SET status = 'past_due',
          updated_at = NOW()
      WHERE id = ${membership.id}
    `;

    await tx.commit();

    if (membership.user_id) {
      try {
        await clerkClient.users.updateUserMetadata(membership.user_id, {
          publicMetadata: { hubStatus: 'past_due' }
        });
      } catch (err) {
        log.error("Falha ao atualizar Clerk metadata após subscription_late", { userId: membership.user_id, error: err });
      }
    }

    log.info("Assinatura marcada como past_due", { orderId, membershipId: membership.id });
  } catch (err) {
    await tx.rollback();
    const errorDetails = err instanceof Error
      ? { message: err.message, stack: err.stack, name: err.name, ...err }
      : { error: String(err) };
    log.error("Erro ao processar subscription_late", { orderId, ...errorDetails });
    throw err;
  }
}

async function handleSubscriptionCanceled(orderId: string) {
  const tx = await db.begin();

  try {
    const membership = await tx.queryRow<{ id: number; status: string; user_id: string | null }>`
      SELECT id, status, user_id FROM memberships WHERE kiwify_order_id = ${orderId} FOR UPDATE
    `;

    if (!membership) {
      await tx.rollback();
      log.warn("Cancelamento para pedido inexistente", { orderId });
      return;
    }

    const wasActive = membership.status === 'active';

    await tx.exec`
      UPDATE memberships
      SET status = 'canceled',
          deactivated_at = NOW(),
          updated_at = NOW()
      WHERE id = ${membership.id}
    `;

    await tx.commit();

    if (membership.user_id) {
      try {
        await clerkClient.users.updateUserMetadata(membership.user_id, {
          publicMetadata: { hubStatus: 'canceled' }
        });
      } catch (err) {
        log.error("Falha ao atualizar Clerk metadata após cancelamento", { userId: membership.user_id, error: err });
      }
    }

    log.info("Assinatura cancelada", { orderId, membershipId: membership.id, wasActive });

    if (wasActive) {
      await promoteNextInWaitlist();
    }
  } catch (err) {
    await tx.rollback();
    const errorDetails = err instanceof Error
      ? { message: err.message, stack: err.stack, name: err.name, ...err }
      : { error: String(err) };
    log.error("Erro ao processar subscription_canceled", { orderId, ...errorDetails });
    throw err;
  }
}

async function handleOrderRefunded(orderId: string) {
  const tx = await db.begin();

  try {
    const membership = await tx.queryRow<{ id: number; status: string; user_id: string | null }>`
      SELECT id, status, user_id FROM memberships WHERE kiwify_order_id = ${orderId} FOR UPDATE
    `;

    if (!membership) {
      await tx.rollback();
      log.warn("Reembolso para pedido inexistente", { orderId });
      return;
    }

    const wasActive = membership.status === 'active';

    await tx.exec`
      UPDATE memberships
      SET status = 'refunded',
          deactivated_at = NOW(),
          updated_at = NOW()
      WHERE id = ${membership.id}
    `;

    await tx.commit();

    if (membership.user_id) {
      try {
        await clerkClient.users.updateUserMetadata(membership.user_id, {
          publicMetadata: { hubStatus: 'refunded' }
        });
      } catch (err) {
        log.error("Falha ao atualizar Clerk metadata após reembolso", { userId: membership.user_id, error: err });
      }
    }

    log.info("Pedido reembolsado", { orderId, membershipId: membership.id, wasActive });

    if (wasActive) {
      await promoteNextInWaitlist();
    }
  } catch (err) {
    await tx.rollback();
    const errorDetails = err instanceof Error
      ? { message: err.message, stack: err.stack, name: err.name, ...err }
      : { error: String(err) };
    log.error("Erro ao processar order_refunded", { orderId, ...errorDetails });
    throw err;
  }
}

async function handleChargeback(orderId: string) {
  const tx = await db.begin();

  try {
    const membership = await tx.queryRow<{ id: number; status: string; user_id: string | null }>`
      SELECT id, status, user_id FROM memberships WHERE kiwify_order_id = ${orderId} FOR UPDATE
    `;

    if (!membership) {
      await tx.rollback();
      log.warn("Chargeback para pedido inexistente", { orderId });
      return;
    }

    const wasActive = membership.status === 'active';

    await tx.exec`
      UPDATE memberships
      SET status = 'canceled',
          deactivated_at = NOW(),
          updated_at = NOW()
      WHERE id = ${membership.id}
    `;

    await tx.commit();

    if (membership.user_id) {
      try {
        await clerkClient.users.updateUserMetadata(membership.user_id, {
          publicMetadata: { hubStatus: 'canceled' }
        });
      } catch (err) {
        log.error("Falha ao atualizar Clerk metadata após chargeback", { userId: membership.user_id, error: err });
      }
    }

    log.info("Chargeback processado", { orderId, membershipId: membership.id, wasActive });

    if (wasActive) {
      await promoteNextInWaitlist();
    }
  } catch (err) {
    await tx.rollback();
    const errorDetails = err instanceof Error
      ? { message: err.message, stack: err.stack, name: err.name, ...err }
      : { error: String(err) };
    log.error("Erro ao processar chargeback", { orderId, ...errorDetails });
    throw err;
  }
}

export const webhookKiwifyDebug = api.raw(
  { method: "GET", path: "/webhooks/kiwify/_debug", expose: true },
  async (_req, res) => {
    if (!debug) {
      res.statusCode = 404;
      res.end();
      return;
    }
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true, route: "/webhooks/kiwify", method: "POST" }));
  }
);
