#!/usr/bin/env node

/**
 * Script de pré-build que injeta variáveis de ambiente do .env no process.env
 * antes do Vite iniciar, garantindo que os valores corretos sejam usados
 * mesmo se o Leap regenerar o vite.config.ts
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis do .env na raiz do frontend
const envPath = resolve(__dirname, '../.env');
const result = config({ path: envPath });

console.log('========================================');
console.log('🔍 ENV INJECTION SCRIPT');
console.log('========================================');
console.log('Loading from:', envPath);
console.log('Result:', result.error ? `❌ ${result.error.message}` : '✅ Success');
console.log('');

// Log das variáveis carregadas (sem expor valores completos)
const envVars = [
  'VITE_CLERK_PUBLISHABLE_KEY_TEST',
  'VITE_CLERK_PUBLISHABLE_KEY_LIVE',
  'VITE_CLERK_FRONTEND_API_TEST',
  'VITE_CLERK_FRONTEND_API_LIVE',
  'VITE_CLIENT_TARGET',
  'VITE_DISABLE_AUTH'
];

console.log('🔑 Environment variables status:');
envVars.forEach(key => {
  const value = process.env[key];
  if (value) {
    const display = value.length > 20 ? `${value.slice(0, 20)}...` : value;
    console.log(`  ${key}: ✅ ${display}`);
  } else {
    console.log(`  ${key}: ❌ NOT SET`);
  }
});

console.log('========================================');
console.log('');

// Forçar definição das variáveis no process.env
// Isso garante que o Vite as pegue automaticamente
if (result.parsed) {
  Object.keys(result.parsed).forEach(key => {
    if (!process.env[key]) {
      process.env[key] = result.parsed[key];
    }
  });
}
