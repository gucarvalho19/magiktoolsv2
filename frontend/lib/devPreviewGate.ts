import { isProd, featureFlags } from './featureFlags';
import { useIsAdmin } from './auth';

export interface DevPreviewGateResult {
  allowed: boolean;
  reason?: string;
}

export function useDevPreviewGate(): DevPreviewGateResult {
  const isAdmin = useIsAdmin();

  if (isProd) {
    return {
      allowed: false,
      reason: 'Esta funcionalidade não está disponível em produção.',
    };
  }

  if (!featureFlags.presellBuilderDev) {
    return {
      allowed: false,
      reason: 'Feature flag VITE_FEATURE_PRESELL_BUILDER_DEV não está ativada.',
    };
  }

  if (!isAdmin) {
    return {
      allowed: false,
      reason: 'Acesso restrito a administradores.',
    };
  }

  return { allowed: true };
}
