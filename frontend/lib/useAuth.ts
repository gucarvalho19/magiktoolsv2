import { useUser as useClerkUser, useClerk as useClerkClient } from '@clerk/clerk-react';
import { config } from '../config';

export function useUser() {
  if (config.disableAuth) {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: 'dev-user',
        fullName: 'Dev User',
        primaryEmailAddress: { emailAddress: 'dev@local' },
        imageUrl: '',
      },
    };
  }
  return useClerkUser();
}

export function useClerk() {
  if (config.disableAuth) {
    return {
      signOut: async () => {
        console.log('Dev mode: signOut called but disabled');
      },
    };
  }
  return useClerkClient();
}
