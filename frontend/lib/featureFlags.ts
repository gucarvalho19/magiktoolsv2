export const isProd = typeof window !== 'undefined' && window.location.hostname === 'app.magik.tools';
export const isDev = !isProd;

export const featureFlags = {
  presellBuilderDev: import.meta.env.VITE_FEATURE_PRESELL_BUILDER_DEV === '1',
};

export const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').filter(Boolean);
