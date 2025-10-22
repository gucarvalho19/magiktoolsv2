import { useAuth } from '@clerk/clerk-react';
import backend from '~backend/client';
import { config } from '../config';

export function useBackend() {
  const { getToken, isSignedIn } = config.disableAuth 
    ? { getToken: async () => null, isSignedIn: true }
    : useAuth();

  if (config.disableAuth) {
    return backend.with({
      auth: async () => ({ "x-dev-auth": "1" })
    });
  }

  if (!isSignedIn) {
    return backend;
  }

  return backend.with({
    auth: async () => {
      const token = await getToken();
      return { authorization: `Bearer ${token}` };
    }
  });
}
