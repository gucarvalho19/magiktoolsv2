import { Header, APIError } from "encore.dev/api";
import { verifyBearer } from "../auth/verifySession";

export interface RequireAuthParams {
  authorization?: Header<"Authorization">;
}

export async function requireAuth(authHeader?: string): Promise<string> {
  try {
    const payload = await verifyBearer(authHeader);
    return (payload as any).sub;
  } catch (err) {
    throw APIError.unauthenticated("Authentication required", err as Error);
  }
}
