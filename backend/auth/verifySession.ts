import { verifyToken } from "@clerk/backend";
import { APIError } from "encore.dev/api";
import { clerkSecretKey } from "./clerk.secrets";

export async function verifyBearer(authHeader?: string) {
  if (!authHeader) {
    throw APIError.unauthenticated("missing auth");
  }
  
  const token = authHeader.replace(/^Bearer\s+/i, "");
  
  try {
    const { payload } = await verifyToken(token, { secretKey: clerkSecretKey() });
    return payload;
  } catch (err) {
    throw APIError.unauthenticated("invalid token", err as Error);
  }
}
