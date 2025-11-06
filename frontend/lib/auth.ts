import { useUser } from './useAuth';
import { adminEmails } from './featureFlags';

export function useIsAdmin(): boolean {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded || !user) return false;
  
  const userEmail = user.primaryEmailAddress?.emailAddress;
  if (!userEmail) return false;
  
  return adminEmails.includes(userEmail);
}
