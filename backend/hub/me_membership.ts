import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import type { Membership } from "./memberships/types";
import { isAdmin } from "./utils";

interface MembershipResponse {
  membership: Membership | null;
  isAdmin: boolean;
}

export const getMembership = api<void, MembershipResponse>(
  { method: "GET", path: "/me/membership", expose: true, auth: true },
  async () => {
    const auth = getAuthData();

    if (!auth) {
      throw APIError.unauthenticated("authentication required");
    }

    const membership = await db.queryRow<Membership>`
      SELECT * FROM memberships WHERE user_id = ${auth.userID}
    `;

    return { 
      membership,
      isAdmin: await isAdmin(auth.userID)
    };
  }
);
