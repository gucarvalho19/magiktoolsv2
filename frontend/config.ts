const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === '1';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

if (!DISABLE_AUTH && !PUBLISHABLE_KEY) {
  throw new Error(
    '[Clerk Config Error] VITE_CLERK_PUBLISHABLE_KEY is required but not defined. ' +
    'Please set this environment variable with your Clerk publishable key ' +
    '(pk_test_... for development/preview or pk_live_... for production).'
  );
}

console.log('🔧 MODE:', import.meta.env.MODE);
console.log('🔑 VITE_CLERK_PUBLISHABLE_KEY prefix:', PUBLISHABLE_KEY.slice(0, 15) || '[NOT SET]');
console.log('🔧 VITE_* keys:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));

export const config = {
  disableAuth: DISABLE_AUTH,
  clerk: {
    publishableKey: PUBLISHABLE_KEY,
  },
};
