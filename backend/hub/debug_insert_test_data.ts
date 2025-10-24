import { api } from "encore.dev/api";
import db from "../db";

interface InsertTestDataResponse {
  success: boolean;
  inserted: {
    id: number;
    email: string;
    kiwifyOrderId: string;
    claimCode: string;
    status: string;
  } | null;
  error?: string;
}

// Temporary debug endpoint - Inserts test data into production database
export const insertTestData = api<void, InsertTestDataResponse>(
  { method: "POST", path: "/debug/insert-test-data", expose: true, auth: false },
  async () => {
    try {
      const testEmail = 'teste@exemplo.com';
      const testOrderId = 'KIW-TEST-12345';
      const testClaimCode = 'MAGIK-A7B2-C9D4';
      const testCpf = '06417609901';

      // First, delete any existing test data with same email or order ID
      await db.exec`
        DELETE FROM memberships 
        WHERE email = ${testEmail} OR kiwify_order_id = ${testOrderId}
      `;

      // Insert fresh test data
      const result = await db.queryRow<{
        id: number;
        email: string;
        kiwify_order_id: string;
        claim_code: string;
        status: string;
      }>`
        INSERT INTO memberships (
          email, 
          kiwify_order_id, 
          status, 
          claim_code, 
          customer_cpf, 
          purchased_at
        ) VALUES (
          ${testEmail}, 
          ${testOrderId}, 
          'active', 
          ${testClaimCode}, 
          ${testCpf}, 
          NOW()
        )
        RETURNING id, email, kiwify_order_id, claim_code, status
      `;

      if (!result) {
        return {
          success: false,
          inserted: null,
          error: 'Insert returned no result'
        };
      }

      return {
        success: true,
        inserted: {
          id: result.id,
          email: result.email,
          kiwifyOrderId: result.kiwify_order_id,
          claimCode: result.claim_code,
          status: result.status
        }
      };
    } catch (error) {
      console.error('[insertTestData] Error:', error);
      return {
        success: false,
        inserted: null,
        error: String(error)
      };
    }
  }
);
