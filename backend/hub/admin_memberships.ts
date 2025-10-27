import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import log from "encore.dev/log";
import { promoteNextInWaitlist } from "./memberships/promote";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import { isAdmin } from "./utils";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

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
  claim_code: string | null;
  claim_code_used_at: Date | null;
  customer_cpf: string | null;
}

interface AdminMembershipsResponse {
  stats: MembershipStats;
  memberships: MembershipListItem[];
}

export const adminMemberships = api<void, AdminMembershipsResponse>(
  { method: "GET", path: "/_admin/memberships", expose: true, auth: true },
  async () => {
    const auth = getAuthData();

    if (!auth || !await isAdmin(auth.userID)) {
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
      SELECT
        id, email, user_id, kiwify_order_id, status,
        purchased_at, activated_at, claim_code, claim_code_used_at, customer_cpf
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

    if (!auth || !await isAdmin(auth.userID)) {
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
        adminUserId: auth.userID,
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

    if (!auth || !await isAdmin(auth.userID)) {
      throw APIError.permissionDenied("admin access required");
    }

    const promoted = await promoteNextInWaitlist();

    log.info("Promoção manual da waitlist por admin", {
      adminUserId: auth.userID,
      promoted
    });

    return { success: true, promoted };
  }
);

interface CreateMembershipRequest {
  email: string;
  kiwifyOrderId: string;
  purchasedAt?: string;
  reason?: string;
}

interface CreateMembershipResponse {
  success: boolean;
  membership: {
    id: number;
    email: string;
    status: string;
    orderId: string;
    claimCode: string;
  };
}

/**
 * Admin endpoint to manually create a membership record
 * Useful when webhooks fail or for backdating memberships
 */
export const createMembership = api<CreateMembershipRequest, CreateMembershipResponse>(
  { method: "POST", path: "/_admin/memberships/create", expose: true, auth: true },
  async (req) => {
    const auth = getAuthData();

    if (!auth || !await isAdmin(auth.userID)) {
      throw APIError.permissionDenied("admin access required");
    }

    const tx = await db.begin();

    try {
      // Check if already exists
      const existing = await tx.queryRow<{ id: number }>`
        SELECT id FROM memberships
        WHERE email = ${req.email} OR kiwify_order_id = ${req.kiwifyOrderId}
      `;

      if (existing) {
        await tx.rollback();
        throw APIError.alreadyExists(
          "membership already exists for this email or order ID"
        );
      }

      // Count active memberships to determine status
      const activeCount = await tx.queryRow<{ count: number }>`
        SELECT COUNT(*) as count FROM memberships WHERE status = 'active'
      `;

      const hasVacancy = (activeCount?.count ?? 0) < 20;
      const status = hasVacancy ? 'active' : 'waitlisted';
      const purchasedAt = req.purchasedAt ? new Date(req.purchasedAt) : new Date();
      const claimCode = req.kiwifyOrderId; // Use order ID as claim code

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
          ${claimCode},
          ${purchasedAt},
          ${hasVacancy ? new Date() : null},
          NOW(),
          NOW()
        )
        RETURNING id
      `;

      // Log admin action for audit
      await tx.exec`
        INSERT INTO admin_actions (
          admin_user_id, action_type, target_membership_id,
          target_user_id, reason, created_at
        )
        VALUES (
          ${auth.userID},
          'create_membership',
          ${result!.id},
          NULL,
          ${req.reason || 'manual creation by admin'},
          NOW()
        )
      `;

      await tx.commit();

      log.info("Admin criou membership manualmente", {
        adminUserId: auth.userID,
        membershipId: result!.id,
        email: req.email,
        kiwifyOrderId: req.kiwifyOrderId,
        status,
        reason: req.reason
      });

      return {
        success: true,
        membership: {
          id: result!.id,
          email: req.email,
          status,
          orderId: req.kiwifyOrderId,
          claimCode
        }
      };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }
);

interface LinkMembershipRequest {
  membershipId: number;
  clerkUserId: string;
  reason?: string;
}

interface ClerkUserInfo {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface LinkMembershipResponse {
  success: boolean;
  membership: {
    id: number;
    email: string;
    status: string;
    orderId: string;
  };
  user: ClerkUserInfo;
}

/**
 * Admin endpoint to manually link a membership to a Clerk user
 * Useful when user uses different email for payment vs sign-up
 */
export const linkMembership = api<LinkMembershipRequest, LinkMembershipResponse>(
  { method: "POST", path: "/_admin/memberships/link", expose: true, auth: true },
  async (req) => {
    const auth = getAuthData();

    if (!auth || !await isAdmin(auth.userID)) {
      throw APIError.permissionDenied("admin access required");
    }

    const tx = await db.begin();

    try {
      // Get membership
      const membership = await tx.queryRow<{
        id: number;
        status: string;
        email: string;
        user_id: string | null;
        kiwify_order_id: string;
      }>`
        SELECT id, status, email, user_id, kiwify_order_id
        FROM memberships
        WHERE id = ${req.membershipId}
        FOR UPDATE
      `;

      if (!membership) {
        await tx.rollback();
        throw APIError.notFound("membership not found");
      }

      if (membership.user_id) {
        await tx.rollback();
        throw APIError.alreadyExists(
          `membership already linked to user ${membership.user_id}`
        );
      }

      // Verify Clerk user exists
      const user = await clerkClient.users.getUser(req.clerkUserId);

      // Check if user already has another membership
      const existing = await tx.queryRow<{ id: number }>`
        SELECT id FROM memberships WHERE user_id = ${req.clerkUserId}
      `;

      if (existing) {
        await tx.rollback();
        throw APIError.alreadyExists(
          "user already has a membership linked"
        );
      }

      // Link membership to user
      await tx.exec`
        UPDATE memberships
        SET user_id = ${req.clerkUserId},
            claim_code_used_at = NOW(),
            updated_at = NOW()
        WHERE id = ${req.membershipId}
      `;

      // Log admin action for audit
      await tx.exec`
        INSERT INTO admin_actions (
          admin_user_id, action_type, target_membership_id,
          target_user_id, reason, created_at
        )
        VALUES (
          ${auth.userID},
          'link_membership',
          ${req.membershipId},
          ${req.clerkUserId},
          ${req.reason || 'manual link by admin'},
          NOW()
        )
      `;

      await tx.commit();

      // Sync with Clerk
      try {
        await clerkClient.users.updateUserMetadata(req.clerkUserId, {
          publicMetadata: { hubStatus: membership.status }
        });
      } catch (err) {
        log.error("Falha ao atualizar Clerk metadata após link manual", {
          userId: req.clerkUserId,
          error: err
        });
      }

      log.info("Admin vinculou membership manualmente", {
        adminUserId: auth.userID,
        membershipId: req.membershipId,
        targetUserId: req.clerkUserId,
        reason: req.reason
      });

      return {
        success: true,
        membership: {
          id: membership.id,
          email: membership.email,
          status: membership.status,
          orderId: membership.kiwify_order_id
        },
        user: {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined
        }
      };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }
);
