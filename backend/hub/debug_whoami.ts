import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { isAdmin } from "./utils";

interface WhoAmIResponse {
  userId: string;
  isAdmin: boolean;
}

export const whoami = api<void, WhoAmIResponse>(
  { method: "GET", path: "/debug/whoami", expose: true, auth: true },
  async () => {
    const auth = getAuthData();

    if (!auth) {
      throw APIError.unauthenticated("authentication required");
    }

    return {
      userId: auth.userID,
      isAdmin: await isAdmin(auth.userID)
    };
  }
);
