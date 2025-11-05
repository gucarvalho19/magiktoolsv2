import { api, APIError } from "encore.dev/api";
import db from "../db";
import log from "encore.dev/log";

interface CreateTestClaimRequest {
  email: string;
  claimCode?: string;  // Optional, will be auto-generated if not provided
}

interface CreateTestClaimResponse {
  success: boolean;
  membershipId: number;
  claimCode: string;
  status: string;
  message: string;
}

// Admin endpoint to create a test membership with a claim code
export const createTestClaim = api<CreateTestClaimRequest, CreateTestClaimResponse>(
  { method: "POST", path: "/admin/create-test-claim", expose: true, auth: false },
  async (req) => {
    const email = req.email.toLowerCase().trim();

    if (!email) {
      throw APIError.invalidArgument("email is required");
    }

    // Generate a random claim code if not provided
    const claimCode = req.claimCode?.toUpperCase().trim() || generateClaimCode();

    const tx = await db.begin();

    try {
      // Check if claim code already exists (case-insensitive)
      const existingCode = await tx.queryRow<{ id: number }>`
        SELECT id FROM memberships WHERE UPPER(claim_code) = ${claimCode}
      `;

      if (existingCode) {
        throw APIError.alreadyExists(`claim code ${claimCode} already exists`);
      }

      // Check active memberships count
      const activeCount = await tx.queryRow<{ count: number }>`
        SELECT COUNT(*) as count FROM memberships WHERE status = 'active'
      `;

      const count = activeCount?.count ?? 0;
      const HUB_CAP = 20;
      const hasVacancy = count < HUB_CAP;
      const status = hasVacancy ? 'active' : 'waitlisted';
      const activatedAt = hasVacancy ? new Date() : null;

      // Create test membership
      const result = await tx.queryRow<{ id: number }>`
        INSERT INTO memberships (
          email,
          kiwify_order_id,
          status,
          claim_code,
          activated_at,
          purchased_at
        )
        VALUES (
          ${email},
          ${'TEST_' + Date.now()},
          ${status},
          ${claimCode},
          ${activatedAt},
          NOW()
        )
        RETURNING id
      `;

      await tx.commit();

      log.info("Test membership created", {
        membershipId: result?.id,
        email,
        claimCode,
        status,
        hasVacancy
      });

      return {
        success: true,
        membershipId: result!.id,
        claimCode,
        status,
        message: `Test membership created successfully. Status: ${status}. Use claim code: ${claimCode}`
      };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }
);

// Generate a random 7-character claim code
function generateClaimCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
