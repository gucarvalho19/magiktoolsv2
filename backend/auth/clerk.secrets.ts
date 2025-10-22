import { secret } from "encore.dev/config";

export const clerkSecretKey = secret("ClerkSecretKey");
export const clerkWebhookSigningSecret = secret("ClerkWebhookSecret");
