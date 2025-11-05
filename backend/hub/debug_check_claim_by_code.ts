import { api } from "encore.dev/api";
import db from "../db";

interface CheckByCodeRequest {
  code: string;
}

interface CheckByCodeResponse {
  found: boolean;
  data?: {
    id: number;
    email: string;
    claimCode: string | null;
    userId: string | null;
    status: string;
    claimCodeUsedAt: string | null;
    purchasedAt: string | null;
  };
}

// Temporary debug endpoint to check claim code status
export const checkClaimByCode = api<CheckByCodeRequest, CheckByCodeResponse>(
  { method: "POST", path: "/debug/check-claim-by-code", expose: true, auth: false },
  async (req) => {
    const code = req.code.toUpperCase().trim().replace(/\s/g, '');

    const membership = await db.queryRow<{
      id: number;
      email: string;
      claim_code: string | null;
      user_id: string | null;
      status: string;
      claim_code_used_at: string | null;
      purchased_at: string | null;
    }>`
      SELECT id, email, claim_code, user_id, status, claim_code_used_at, purchased_at
      FROM memberships
      WHERE claim_code = ${code}
      LIMIT 1
    `;

    if (!membership) {
      return { found: false };
    }

    return {
      found: true,
      data: {
        id: membership.id,
        email: membership.email,
        claimCode: membership.claim_code,
        userId: membership.user_id,
        status: membership.status,
        claimCodeUsedAt: membership.claim_code_used_at,
        purchasedAt: membership.purchased_at
      }
    };
  }
);
