import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

export async function requireHubActive(): Promise<void> {
  const auth = getAuthData();

  if (!auth) {
    throw APIError.unauthenticated("authentication required");
  }

  return;
}
