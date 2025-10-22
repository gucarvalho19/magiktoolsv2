import { useAuth } from "@clerk/clerk-react";
import backend from "~backend/client";
import { config } from "../config";

export function useBackend() {
  if (config.disableAuth) {
    return backend.with({
      auth: async () => ({
        "x-dev-auth": "1",
      }),
    });
  }

  const { getToken } = useAuth();
  return backend.with({
    auth: async () => {
      const token = await getToken();
      if (!token) return {};
      return { authorization: `Bearer ${token}` };
    }
  });
}
