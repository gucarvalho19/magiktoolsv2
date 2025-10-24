import { api } from "encore.dev/api";
import db from "../db";

interface DebugResponse {
  totalCount: number;
  allEmails: string[];
  allMemberships: Array<{
    id: number;
    email: string;
    kiwifyOrderId: string | null;
    claimCode: string | null;
    userId: string | null;
    status: string;
  }>;
}

// Temporary debug endpoint - PUBLIC for testing
export const listAllMemberships = api<void, DebugResponse>(
  { method: "GET", path: "/debug/memberships", expose: true, auth: false },
  async () => {
    const count = await db.queryRow<{ total: number }>`
      SELECT COUNT(*)::int as total FROM memberships
    `;

    const memberships = await db.query<{
      id: number;
      email: string;
      kiwify_order_id: string | null;
      claim_code: string | null;
      user_id: string | null;
      status: string;
    }>`
      SELECT id, email, kiwify_order_id, claim_code, user_id, status
      FROM memberships
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return {
      totalCount: count?.total || 0,
      allEmails: memberships.map(m => m.email),
      allMemberships: memberships.map(m => ({
        id: m.id,
        email: m.email,
        kiwifyOrderId: m.kiwify_order_id,
        claimCode: m.claim_code,
        userId: m.user_id,
        status: m.status
      }))
    };
  }
);
