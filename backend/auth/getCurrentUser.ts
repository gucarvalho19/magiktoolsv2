import { getAuthData } from "~encore/auth";
import type { AuthData } from "./auth";

export function getCurrentUser(): AuthData {
  const authData = getAuthData();
  if (!authData) {
    throw new Error("User not authenticated");
  }
  return authData;
}
