import { Webhook } from "svix";
import { APIError } from "encore.dev/api";
import { clerkWebhookSigningSecret } from "./clerk.secrets";
import log from "encore.dev/log";

export async function verifyClerkWebhook(
  rawBody: string,
  headers: Record<string, string>
): Promise<any> {
  const svixId = headers["svix-id"];
  const svixTimestamp = headers["svix-timestamp"];
  const svixSignature = headers["svix-signature"];

  if (!svixId || !svixTimestamp || !svixSignature) {
    log.error("Missing Clerk webhook headers");
    throw APIError.unauthenticated("Missing webhook headers");
  }

  const wh = new Webhook(clerkWebhookSigningSecret());

  try {
    const evt = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as any;

    return evt;
  } catch (err) {
    log.error("Clerk webhook verification failed", { error: err });
    throw APIError.unauthenticated("Invalid webhook signature", err as Error);
  }
}
