import { api, APIError } from "encore.dev/api";
import db from "../db";

interface FindMembershipRequest {
  orderId?: string;
  email?: string;
}

interface MembershipInfo {
  id: number;
  email: string;
  status: string;
  purchasedAt: string;
  isClaimed: boolean;
  claimCode?: string;
}

interface FindMembershipResponse {
  found: boolean;
  membership?: MembershipInfo;
}

/**
 * Find a membership by order reference (claim code) or email
 * Public endpoint - does not require authentication
 * Only shows claim code if membership is not yet claimed
 *
 * orderId parameter accepts:
 * - order_ref (claim_code) like "q5TWQya" - what customer sees (preferred)
 * - kiwify_order_id (UUID) like "7322272c-bb89-4df0-be5f-cffe289a8bd6" - fallback
 */
export const findMembership = api<FindMembershipRequest, FindMembershipResponse>(
  { method: "POST", path: "/memberships/find", expose: true, auth: false },
  async (req) => {
    // Validate input
    if (!req.orderId && !req.email) {
      throw APIError.invalidArgument("either orderId or email is required");
    }

    let membership: {
      id: number;
      email: string;
      status: string;
      purchased_at: string;
      user_id: string | null;
      claim_code: string | null;
      claim_code_used_at: string | null;
    } | null = null;

    // Search by order ref (claim code - what customer sees in confirmation email)
    if (req.orderId) {
      const orderIdTrim = req.orderId.trim().toUpperCase();

      // First try to find by claim_code (order_ref) - what the customer sees
      membership = await db.queryRow`
        SELECT id, email, status, purchased_at, user_id, claim_code, claim_code_used_at
        FROM memberships
        WHERE UPPER(claim_code) = ${orderIdTrim}
      `;

      // Fallback: try searching by kiwify_order_id (UUID) if not found
      if (!membership) {
        membership = await db.queryRow`
          SELECT id, email, status, purchased_at, user_id, claim_code, claim_code_used_at
          FROM memberships
          WHERE kiwify_order_id = ${orderIdTrim}
        `;
      }
    }
    // Search by email (may return most recent)
    else if (req.email) {
      const emailLower = req.email.toLowerCase().trim();

      membership = await db.queryRow`
        SELECT id, email, status, purchased_at, user_id, claim_code, claim_code_used_at
        FROM memberships
        WHERE LOWER(email) = ${emailLower}
        ORDER BY purchased_at DESC
        LIMIT 1
      `;
    }

    if (!membership) {
      return { found: false };
    }

    const isClaimed = !!membership.user_id;

    return {
      found: true,
      membership: {
        id: membership.id,
        email: membership.email,
        status: membership.status,
        purchasedAt: membership.purchased_at,
        isClaimed,
        // Only show claim code if not yet claimed
        claimCode: isClaimed ? undefined : membership.claim_code || undefined
      }
    };
  }
);
