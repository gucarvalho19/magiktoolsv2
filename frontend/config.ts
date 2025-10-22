const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === '1';

const isProd = typeof window !== 'undefined' && window.location.hostname === 'app.magik.tools';

const PUBLISHABLE_KEY = isProd
  ? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_LIVE || ''
  : import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_TEST || '';

const FRONTEND_API = isProd
  ? import.meta.env.VITE_CLERK_FRONTEND_API_LIVE || ''
  : import.meta.env.VITE_CLERK_FRONTEND_API_TEST || '';

if (!DISABLE_AUTH && !PUBLISHABLE_KEY) {
  const envName = isProd ? 'VITE_CLERK_PUBLISHABLE_KEY_LIVE' : 'VITE_CLERK_PUBLISHABLE_KEY_TEST';
  throw new Error(
    `[Clerk Config Error] ${envName} is required but not defined. ` +
    `Please set this environment variable with your Clerk publishable key ` +
    `(pk_test_... for development/preview or pk_live_... for production).`
  );
}

console.log('🔧 Config loaded:', {
  environment: isProd ? 'production' : 'development',
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
  disableAuth: DISABLE_AUTH,
  publishableKeyPrefix: PUBLISHABLE_KEY.slice(0, 15) || '[NOT SET]',
  frontendApi: FRONTEND_API || '[NOT SET]',
});

export const config = {
  disableAuth: DISABLE_AUTH,
  clerk: {
    publishableKey: PUBLISHABLE_KEY,
    frontendApi: FRONTEND_API,
  },
};
