import { api } from "encore.dev/api";
import db from "../db";

export const insertMembershipDebug = api(
  { method: "POST", path: "/debug/insert-membership", expose: true, auth: false },
  async (params: { email: string; orderId: string; code: string }) => {
    // Count active
    const count = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM memberships WHERE status = 'active'
    `;

    const status = (count?.count ?? 0) < 20 ? 'active' : 'waitlisted';

    // Insert
    const activatedAt = status === 'active' ? new Date() : null;

    const result = await db.queryRow<{ id: number }>`
      INSERT INTO memberships (
        email, kiwify_order_id, status, claim_code,
        purchased_at, activated_at, created_at, updated_at
      ) VALUES (
        ${params.email}, ${params.orderId}, ${status}, ${params.code},
        NOW(), ${activatedAt}, NOW(), NOW()
      )
      RETURNING id
    `;

    return { success: true, id: result!.id, status };
  }
);
