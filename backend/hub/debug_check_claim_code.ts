import { api } from "encore.dev/api";
import db from "../db";

interface CheckClaimCodeRequest {
  email: string;
}

interface CheckClaimCodeResponse {
  found: boolean;
  data?: {
    id: number;
    email: string;
    kiwifyOrderId: string | null;
    claimCode: string | null;
    userId: string | null;
    status: string;
  };
}

// Temporary debug endpoint to check what's in the database
export const checkClaimCode = api<CheckClaimCodeRequest, CheckClaimCodeResponse>(
  { method: "POST", path: "/debug/check-claim-code", expose: true, auth: false },
  async (req) => {
    const emailLower = req.email.toLowerCase().trim();

    const membership = await db.queryRow<{
      id: number;
      email: string;
      kiwify_order_id: string | null;
      claim_code: string | null;
      user_id: string | null;
      status: string;
    }>`
      SELECT id, email, kiwify_order_id, claim_code, user_id, status
      FROM memberships
      WHERE LOWER(email) = ${emailLower}
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
        kiwifyOrderId: membership.kiwify_order_id,
        claimCode: membership.claim_code,
        userId: membership.user_id,
        status: membership.status
      }
    };
  }
);
