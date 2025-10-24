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

// DEBUG ENDPOINT - TEMPORARY
interface DebugListResponse {
  total: number;
  memberships: Array<{
    id: number;
    email: string;
    kiwify_order_id: string | null;
    claim_code: string | null;
    user_id: string | null;
    status: string;
  }>;
}

export const debugListMemberships = api<void, DebugListResponse>(
  { method: "GET", path: "/memberships/debug/list", expose: true, auth: false },
  async () => {
    const memberships = await db.query`
      SELECT id, email, kiwify_order_id, claim_code, user_id, status, created_at
      FROM memberships
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return {
      total: memberships.length,
      memberships: memberships.map(m => ({
        id: m.id,
        email: m.email,
        kiwify_order_id: m.kiwify_order_id,
        claim_code: m.claim_code,
        user_id: m.user_id,
        status: m.status
      }))
    };
  }
);

/**
 * Find a membership by order ID or email
 * Public endpoint - does not require authentication
 * Only shows claim code if membership is not yet claimed
 */
export const findMembership = api<FindMembershipRequest, FindMembershipResponse>(
  { method: "POST", path: "/memberships/find", expose: true, auth: false },
  async (req) => {
    console.log('[findMembership] Request received:', req);

    // Validate input
    if (!req.orderId && !req.email) {
      throw APIError.invalidArgument("either orderId or email is required");
    }

    // DEBUG: Count total memberships in database
    let totalCount = 0;
    let sampleEmails: string[] = [];

    try {
      const countResult = await db.queryRow<{ total: number }>`SELECT COUNT(*)::int as total FROM memberships`;
      totalCount = countResult?.total || 0;
      console.log('[findMembership] Total memberships in DB:', totalCount);

      // DEBUG: List all emails in database
      const allEmails = await db.query<{ id: number; email: string; kiwify_order_id: string | null }>`
        SELECT id, email, kiwify_order_id FROM memberships LIMIT 10
      `;
      sampleEmails = allEmails.map(e => e.email);
      console.log('[findMembership] Sample emails in DB:', sampleEmails);
    } catch (debugError) {
      console.error('[findMembership] Debug query error:', debugError);
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

    // Search by order ID (most specific)
    if (req.orderId) {
      const orderIdTrim = req.orderId.trim();
      console.log('[findMembership] Searching by orderId:', orderIdTrim);

      membership = await db.queryRow`
        SELECT id, email, status, purchased_at, user_id, claim_code, claim_code_used_at
        FROM memberships
        WHERE kiwify_order_id = ${orderIdTrim}
      `;

      console.log('[findMembership] Query result for orderId:', membership);
    }
    // Search by email (may return most recent)
    else if (req.email) {
      const emailLower = req.email.toLowerCase().trim();
      console.log('[findMembership] Searching by email:', emailLower);

      membership = await db.queryRow`
        SELECT id, email, status, purchased_at, user_id, claim_code, claim_code_used_at
        FROM memberships
        WHERE LOWER(email) = ${emailLower}
        ORDER BY purchased_at DESC
        LIMIT 1
      `;

      console.log('[findMembership] Query result for email:', membership);
    }

    if (!membership) {
      console.log('[findMembership] No membership found, returning found: false');
      // DEBUG: Return additional info in production
      return {
        found: false,
        // @ts-ignore - temporary debug info
        _debug: {
          totalInDb: totalCount,
          searchedEmail: req.email?.toLowerCase().trim(),
          searchedOrderId: req.orderId?.trim(),
          sampleEmails: sampleEmails
        }
      } as any;
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
