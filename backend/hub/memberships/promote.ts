import db from "../../db";
import log from "encore.dev/log";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export async function promoteNextInWaitlist(): Promise<boolean> {
  const tx = await db.begin();

  try {
    const nextInLine = await tx.queryRow<{ id: number; email: string; user_id: string | null }>`
      SELECT id, email, user_id
      FROM memberships
      WHERE status = 'waitlisted'
      ORDER BY purchased_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (!nextInLine) {
      await tx.rollback();
      return false;
    }

    await tx.exec`
      UPDATE memberships
      SET status = 'active',
          activated_at = NOW(),
          updated_at = NOW()
      WHERE id = ${nextInLine.id}
    `;

    await tx.commit();

    if (nextInLine.user_id) {
      try {
        await clerkClient.users.updateUserMetadata(nextInLine.user_id, {
          publicMetadata: { hubStatus: 'active' }
        });
      } catch (err) {
        log.error("Falha ao atualizar metadata Clerk", { userId: nextInLine.user_id, error: err });
      }
    }

    log.info("Usuário promovido da waitlist", {
      membershipId: nextInLine.id,
      email: nextInLine.email,
      userId: nextInLine.user_id
    });

    return true;
  } catch (err) {
    await tx.rollback();
    log.error("Erro ao promover da waitlist", { error: err });
    throw err;
  }
}
