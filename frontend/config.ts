// frontend/config.ts
const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === '1';

const PUBLISHABLE_KEY = DISABLE_AUTH ? '' : (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '');

console.log('🔧 MODE:', import.meta.env.MODE);
console.log('🔑 VITE_CLERK_PUBLISHABLE_KEY prefix:', import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.slice(0, 15));
console.log('🔧 VITE_* keys:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));

export const config = {
  disableAuth: DISABLE_AUTH,
  clerk: {
    publishableKey: PUBLISHABLE_KEY,
  },
};

if (typeof window !== 'undefined' && !DISABLE_AUTH && !config.clerk.publishableKey) {
  console.error('[Clerk] Missing publishable key at runtime');
}