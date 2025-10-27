import { api, APIError } from "encore.dev/api";
import db from "../db";
import log from "encore.dev/log";

interface CreateMembershipManualRequest {
  email: string;
  kiwifyOrderId: string;
  claimCode: string;
  purchasedAt?: string;
}

interface CreateMembershipManualResponse {
  success: boolean;
  membershipId: number;
  status: string;
}

/**
 * Temporary admin endpoint to create membership records manually
 * NO AUTH - Use with caution, remove after fixing missing records
 */
export const adminCreateMembershipRecord = api<CreateMembershipManualRequest, CreateMembershipManualResponse>(
  { method: "POST", path: "/admin/create-membership-record", expose: true, auth: false },
  async (req) => {
    const tx = await db.begin();

    try {
      // Check if already exists
      const existing = await tx.queryRow<{ id: number }>`
        SELECT id FROM memberships
        WHERE email = ${req.email} OR kiwify_order_id = ${req.kiwifyOrderId}
      `;

      if (existing) {
        await tx.rollback();
        throw APIError.alreadyExists("membership already exists for this email or order ID");
      }

      // Count active memberships
      const activeCount = await tx.queryRow<{ count: number }>`
        SELECT COUNT(*) as count FROM memberships WHERE status = 'active'
      `;

      const hasVacancy = (activeCount?.count ?? 0) < 20;
      const status = hasVacancy ? 'active' : 'waitlisted';
      const purchasedAt = req.purchasedAt ? new Date(req.purchasedAt) : new Date();

      // Insert membership
      const result = await tx.queryRow<{ id: number }>`
        INSERT INTO memberships (
          email,
          kiwify_order_id,
          status,
          claim_code,
          purchased_at,
          activated_at,
          created_at,
          updated_at
        ) VALUES (
          ${req.email},
          ${req.kiwifyOrderId},
          ${status},
          ${req.claimCode},
          ${purchasedAt},
          ${hasVacancy ? new Date() : null},
          NOW(),
          NOW()
        )
        RETURNING id
      `;

      await tx.commit();

      log.info("Membership criada manualmente via endpoint temporário", {
        membershipId: result!.id,
        email: req.email,
        kiwifyOrderId: req.kiwifyOrderId,
        status
      });

      return {
        success: true,
        membershipId: result!.id,
        status
      };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }
);
