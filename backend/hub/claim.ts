import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import db from "../db";
import log from "encore.dev/log";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

interface ClaimRequest {
  claimCode?: string;  // Preferred method
  email?: string;      // Legacy fallback
}

interface ClaimResponse {
  success: boolean;
  status?: string;
  message?: string;
}

export const claim = api<ClaimRequest, ClaimResponse>(
  { method: "POST", path: "/claim", expose: true, auth: true },
  async (req) => {
    const auth = getAuthData();

    if (!auth) {
      throw APIError.unauthenticated("authentication required");
    }

    // Validate input: must have either claimCode or email
    if (!req.claimCode && !req.email) {
      throw APIError.invalidArgument("either claimCode or email is required");
    }

    const tx = await db.begin();

    try {
      // Check if user already has a membership
      const existing = await tx.queryRow<{ id: number }>`
        SELECT id FROM memberships WHERE user_id = ${auth.userID}
      `;

      if (existing) {
        throw APIError.alreadyExists("user already has a claimed membership");
      }

      let membership: { id: number; status: string; email: string; claim_code_used_at?: string } | null = null;
      let claimMethod = '';

      // OPTION 1: Claim by code (PREFERRED)
      if (req.claimCode) {
        const code = req.claimCode.toUpperCase().trim().replace(/\s/g, '');
        claimMethod = 'claim_code';

        // First, check if the code exists at all (case-insensitive)
        const codeCheck = await tx.queryRow<{ id: number; user_id: string | null; status: string; claim_code_used_at: string | null }>`
          SELECT id, user_id, status, claim_code_used_at
          FROM memberships
          WHERE UPPER(claim_code) = ${code}
        `;

        membership = await tx.queryRow<{ id: number; status: string; email: string; claim_code_used_at?: string }>`
          SELECT id, status, email, claim_code_used_at
          FROM memberships
          WHERE UPPER(claim_code) = ${code} AND user_id IS NULL
          FOR UPDATE
        `;

        if (!membership) {
          // If code exists but couldn't be claimed, it's already linked to a user
          if (codeCheck) {
            throw APIError.alreadyExists("this claim code is already linked to another user");
          }

          throw APIError.notFound("invalid claim code");
        }

        if (membership.claim_code_used_at) {
          throw APIError.alreadyExists("claim code already used");
        }

        // Mark code as used and link to user
        await tx.exec`
          UPDATE memberships
          SET user_id = ${auth.userID},
              claim_code_used_at = NOW(),
              updated_at = NOW()
          WHERE id = ${membership.id}
        `;
      }
      // OPTION 2: Claim by email (LEGACY - for backwards compatibility)
      else if (req.email) {
        const emailLower = req.email.toLowerCase().trim();
        claimMethod = 'email';

        membership = await tx.queryRow<{ id: number; status: string; email: string }>`
          SELECT id, status, email
          FROM memberships
          WHERE LOWER(email) = ${emailLower}
            AND user_id IS NULL
          ORDER BY purchased_at ASC
          LIMIT 1
          FOR UPDATE
        `;

        if (!membership) {
          throw APIError.notFound("no unclaimed membership found for this email");
        }

        await tx.exec`
          UPDATE memberships
          SET user_id = ${auth.userID},
              updated_at = NOW()
          WHERE id = ${membership.id}
        `;
      }

      await tx.commit();

      // Sync with Clerk
      try {
        await clerkClient.users.updateUserMetadata(auth.userID, {
          publicMetadata: { hubStatus: membership!.status }
        });
      } catch (err) {
        log.error("Falha ao atualizar metadata Clerk no claim", { userId: auth.userID, error: err });
      }

      log.info("Membership vinculada ao usuário", {
        userId: auth.userID,
        membershipId: membership!.id,
        email: membership!.email,
        status: membership!.status,
        method: claimMethod
      });

      return {
        success: true,
        status: membership!.status,
        message: `Membership successfully claimed via ${claimMethod}`
      };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }
);
