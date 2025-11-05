import { api } from "encore.dev/api";

/**
 * Webhook endpoint minimalista para testar registro
 */
export const webhookClerk = api.raw(
  { method: "POST", path: "/webhooks/clerk", expose: true },
  async (req, res) => {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ status: "ok", message: "Minimal endpoint works!" }));
  }
);

/**
 * Endpoint de debug minimalista
 */
export const webhookClerkDebug = api.raw(
  { method: "GET", path: "/webhooks/clerk/_debug", expose: true },
  async (req, res) => {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({
      ok: true,
      message: "Minimal debug endpoint works!"
    }));
  }
);
