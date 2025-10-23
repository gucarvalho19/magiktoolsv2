const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === '1';

const isProd = typeof window !== 'undefined' && window.location.hostname === 'app.magik.tools';

const PUBLISHABLE_KEY = isProd
  ? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_LIVE || ''
  : import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_TEST || '';

const FRONTEND_API = isProd
  ? import.meta.env.VITE_CLERK_FRONTEND_API_LIVE || ''
  : import.meta.env.VITE_CLERK_FRONTEND_API_TEST || '';

// Validação de configuração apenas se autenticação estiver habilitada
const configError = !DISABLE_AUTH && !PUBLISHABLE_KEY
  ? (() => {
      const envName = isProd ? 'VITE_CLERK_PUBLISHABLE_KEY_LIVE' : 'VITE_CLERK_PUBLISHABLE_KEY_TEST';
      const errorMsg =
        `[Clerk Config Error] ${envName} is required but not defined. ` +
        `Please set this environment variable with your Clerk publishable key ` +
        `(pk_test_... for development/preview or pk_live_... for production).`;

      console.error('❌', errorMsg);
      console.error('Environment:', {
        isProd,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
        availableVars: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')),
      });

      return errorMsg;
    })()
  : null;

console.log('🔧 Config loaded:', {
  environment: isProd ? 'production' : 'development',
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
  disableAuth: DISABLE_AUTH,
  publishableKeyPrefix: PUBLISHABLE_KEY.slice(0, 15) || '[NOT SET]',
  frontendApi: FRONTEND_API || '[NOT SET]',
  hasError: !!configError,
});

export const config = {
  disableAuth: DISABLE_AUTH,
  configError,
  clerk: {
    publishableKey: PUBLISHABLE_KEY,
    frontendApi: FRONTEND_API,
  },
};
