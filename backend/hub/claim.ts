import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import db from "../db";
import log from "encore.dev/log";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

interface ClaimRequest {
  email: string;
}

interface ClaimResponse {
  success: boolean;
  status?: string;
}

export const claim = api<ClaimRequest, ClaimResponse>(
  { method: "POST", path: "/claim", expose: true, auth: true },
  async (req) => {
    const auth = getAuthData();

    if (!auth) {
      throw APIError.unauthenticated("authentication required");
    }

    const emailLower = req.email.toLowerCase().trim();

    const tx = await db.begin();

    try {
      const existing = await tx.queryRow<{ id: number }>`
        SELECT id FROM memberships WHERE user_id = ${auth.userID}
      `;

      if (existing) {
        await tx.rollback();
        throw APIError.alreadyExists("user already has a claimed membership");
      }

      const membership = await tx.queryRow<{ id: number; status: string; email: string }>`
        SELECT id, status, email
        FROM memberships
        WHERE LOWER(email) = ${emailLower}
          AND user_id IS NULL
        ORDER BY purchased_at ASC
        LIMIT 1
        FOR UPDATE
      `;

      if (!membership) {
        await tx.rollback();
        throw APIError.notFound("no unclaimed membership found for this email");
      }

      await tx.exec`
        UPDATE memberships
        SET user_id = ${auth.userID},
            updated_at = NOW()
        WHERE id = ${membership.id}
      `;

      await tx.commit();

      try {
        await clerkClient.users.updateUserMetadata(auth.userID, {
          publicMetadata: { hubStatus: membership.status }
        });
      } catch (err) {
        log.error("Falha ao atualizar metadata Clerk no claim", { userId: auth.userID, error: err });
      }

      log.info("Membership vinculada ao usuário", {
        userId: auth.userID,
        membershipId: membership.id,
        email: emailLower,
        status: membership.status
      });

      return {
        success: true,
        status: membership.status
      };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }
);
