import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const adminUserIDs = secret("AdminUserIDs");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export async function isAdmin(userId: string): Promise<boolean> {
  const adminIdsStr = adminUserIDs();
  const adminIds = adminIdsStr.split(",").map(id => id.trim()).filter(Boolean);
  
  if (adminIds.includes(userId)) {
    return true;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    return user.publicMetadata?.role === 'admin';
  } catch {
    return false;
  }
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function formatMessage(message: string): string {
  return `[${getCurrentTimestamp()}] ${message}`;
}