import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { secret } from "encore.dev/config";
import { isAdmin } from "./utils";

const adminUserIDs = secret("AdminUserIDs");

interface WhoAmIResponse {
  userId: string;
  adminIds: string[];
  isAdmin: boolean;
}

export const whoami = api<void, WhoAmIResponse>(
  { method: "GET", path: "/debug/whoami", expose: true, auth: true },
  async () => {
    const auth = getAuthData();

    if (!auth) {
      throw APIError.unauthenticated("authentication required");
    }

    const adminIdsStr = adminUserIDs();
    const adminIds = adminIdsStr.split(",").map(id => id.trim()).filter(Boolean);

    return {
      userId: auth.userID,
      adminIds,
      isAdmin: await isAdmin(auth.userID)
    };
  }
);
