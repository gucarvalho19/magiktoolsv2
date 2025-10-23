import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente do arquivo .env correto
  // Isso SOBRESCREVE os Secrets do Encore que podem estar vazios
  const env = loadEnv(mode, process.cwd(), '')

  // DEBUG: Log environment variables durante o build
  console.log('========================================');
  console.log('🔍 VITE BUILD DEBUG');
  console.log('========================================');
  console.log('Mode:', mode);
  console.log('Node ENV:', process.env.NODE_ENV);
  console.log('CWD:', process.cwd());
  console.log('');
  console.log('🔑 Loaded from .env files:');
  console.log('  VITE_CLERK_PUBLISHABLE_KEY_TEST:', env.VITE_CLERK_PUBLISHABLE_KEY_TEST ? '✅ SET (' + env.VITE_CLERK_PUBLISHABLE_KEY_TEST.slice(0, 20) + '...)' : '❌ NOT SET');
  console.log('  VITE_CLERK_PUBLISHABLE_KEY_LIVE:', env.VITE_CLERK_PUBLISHABLE_KEY_LIVE ? '✅ SET (' + env.VITE_CLERK_PUBLISHABLE_KEY_LIVE.slice(0, 20) + '...)' : '❌ NOT SET');
  console.log('  VITE_CLERK_FRONTEND_API_TEST:', env.VITE_CLERK_FRONTEND_API_TEST || '❌ NOT SET');
  console.log('  VITE_CLERK_FRONTEND_API_LIVE:', env.VITE_CLERK_FRONTEND_API_LIVE || '❌ NOT SET');
  console.log('  VITE_CLIENT_TARGET:', env.VITE_CLIENT_TARGET || '❌ NOT SET');
  console.log('  VITE_DISABLE_AUTH:', env.VITE_DISABLE_AUTH || '(not set - OK)');
  console.log('');
  console.log('🔑 From process.env (can be overridden by Encore Secrets):');
  console.log('  VITE_CLERK_PUBLISHABLE_KEY_TEST:', process.env.VITE_CLERK_PUBLISHABLE_KEY_TEST ? '✅ SET (' + process.env.VITE_CLERK_PUBLISHABLE_KEY_TEST.slice(0, 20) + '...)' : '❌ NOT SET');
  console.log('  VITE_CLERK_PUBLISHABLE_KEY_LIVE:', process.env.VITE_CLERK_PUBLISHABLE_KEY_LIVE ? '✅ SET (' + process.env.VITE_CLERK_PUBLISHABLE_KEY_LIVE.slice(0, 20) + '...)' : '❌ NOT SET');
  console.log('========================================');

  // Forçar injeção das variáveis usando define
  // Isso garante que os valores dos .env sejam usados, mesmo que Secrets sobrescrevam process.env
  const define = {
    'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_TEST': JSON.stringify(env.VITE_CLERK_PUBLISHABLE_KEY_TEST || ''),
    'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_LIVE': JSON.stringify(env.VITE_CLERK_PUBLISHABLE_KEY_LIVE || ''),
    'import.meta.env.VITE_CLERK_FRONTEND_API_TEST': JSON.stringify(env.VITE_CLERK_FRONTEND_API_TEST || ''),
    'import.meta.env.VITE_CLERK_FRONTEND_API_LIVE': JSON.stringify(env.VITE_CLERK_FRONTEND_API_LIVE || ''),
    'import.meta.env.VITE_CLIENT_TARGET': JSON.stringify(env.VITE_CLIENT_TARGET || '/'),
    'import.meta.env.VITE_DISABLE_AUTH': JSON.stringify(env.VITE_DISABLE_AUTH || ''),
  };

  console.log('✅ Injecting variables via define:', Object.keys(define));

  return {
    define,
    resolve: {
      alias: {
        '@': path.resolve(__dirname),
        '~backend/client': path.resolve(__dirname, './client'),
        '~backend': path.resolve(__dirname, '../backend'),
      },
    },
    plugins: [tailwindcss(), react()],
    build: {
      // Minify apenas em produção para builds otimizados
      minify: mode === 'production' ? 'esbuild' : false,
      // Source maps para debugging em desenvolvimento
      sourcemap: mode !== 'production',
    }
  };
});
