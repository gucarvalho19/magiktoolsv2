import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import log from "encore.dev/log";
import { promoteNextInWaitlist } from "./memberships/promote";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

const ADMIN_EMAILS = ["admin@magiktools.com", "dev@local"];

interface MembershipStats {
  active: number;
  waitlisted: number;
  past_due: number;
  canceled: number;
  refunded: number;
  total: number;
  cap: number;
}

interface MembershipListItem {
  id: number;
  email: string;
  user_id: string | null;
  kiwify_order_id: string;
  status: string;
  purchased_at: Date;
  activated_at: Date | null;
}

interface AdminMembershipsResponse {
  stats: MembershipStats;
  memberships: MembershipListItem[];
}

export const adminMemberships = api<void, AdminMembershipsResponse>(
  { method: "GET", path: "/_admin/memberships", expose: true, auth: true },
  async () => {
    const auth = getAuthData();

    if (!auth || !auth.email || !ADMIN_EMAILS.includes(auth.email)) {
      throw APIError.permissionDenied("admin access required");
    }

    const stats = await db.queryRow<{
      active: number;
      waitlisted: number;
      past_due: number;
      canceled: number;
      refunded: number;
      total: number;
    }>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'waitlisted') as waitlisted,
        COUNT(*) FILTER (WHERE status = 'past_due') as past_due,
        COUNT(*) FILTER (WHERE status = 'canceled') as canceled,
        COUNT(*) FILTER (WHERE status = 'refunded') as refunded,
        COUNT(*) as total
      FROM memberships
    `;

    const memberships = await db.queryAll<MembershipListItem>`
      SELECT id, email, user_id, kiwify_order_id, status, purchased_at, activated_at
      FROM memberships
      ORDER BY purchased_at DESC
      LIMIT 100
    `;

    return {
      stats: {
        active: stats?.active ?? 0,
        waitlisted: stats?.waitlisted ?? 0,
        past_due: stats?.past_due ?? 0,
        canceled: stats?.canceled ?? 0,
        refunded: stats?.refunded ?? 0,
        total: stats?.total ?? 0,
        cap: 20,
      },
      memberships,
    };
  }
);

interface RevokeMembershipRequest {
  membershipId: number;
}

interface RevokeMembershipResponse {
  success: boolean;
}

export const revokeMembership = api<RevokeMembershipRequest, RevokeMembershipResponse>(
  { method: "POST", path: "/_admin/memberships/:membershipId/revoke", expose: true, auth: true },
  async (req) => {
    const auth = getAuthData();

    if (!auth || !auth.email || !ADMIN_EMAILS.includes(auth.email)) {
      throw APIError.permissionDenied("admin access required");
    }

    const tx = await db.begin();

    try {
      const membership = await tx.queryRow<{ id: number; status: string; user_id: string | null }>`
        SELECT id, status, user_id FROM memberships WHERE id = ${req.membershipId} FOR UPDATE
      `;

      if (!membership) {
        await tx.rollback();
        throw APIError.notFound("membership not found");
      }

      const wasActive = membership.status === 'active';

      await tx.exec`
        UPDATE memberships
        SET status = 'canceled',
            deactivated_at = NOW(),
            updated_at = NOW()
        WHERE id = ${req.membershipId}
      `;

      await tx.commit();

      if (membership.user_id) {
        try {
          await clerkClient.users.updateUserMetadata(membership.user_id, {
            publicMetadata: { hubStatus: 'canceled' }
          });
        } catch (err) {
          log.error("Falha ao atualizar Clerk metadata após revogação admin", { userId: membership.user_id, error: err });
        }
      }

      log.info("Membership revogada por admin", {
        membershipId: req.membershipId,
        adminEmail: auth.email,
        wasActive
      });

      if (wasActive) {
        await promoteNextInWaitlist();
      }

      return { success: true };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }
);

interface PromoteNextResponse {
  success: boolean;
  promoted: boolean;
}

export const adminPromoteNext = api<void, PromoteNextResponse>(
  { method: "POST", path: "/_admin/memberships/promote-next", expose: true, auth: true },
  async () => {
    const auth = getAuthData();

    if (!auth || !auth.email || !ADMIN_EMAILS.includes(auth.email)) {
      throw APIError.permissionDenied("admin access required");
    }

    const promoted = await promoteNextInWaitlist();

    log.info("Promoção manual da waitlist por admin", {
      adminEmail: auth.email,
      promoted
    });

    return { success: true, promoted };
  }
);
