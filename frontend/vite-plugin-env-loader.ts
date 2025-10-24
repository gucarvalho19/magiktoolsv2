/**
 * Plugin Vite para carregar variáveis de ambiente do .env
 * Este plugin pode ser importado em qualquer vite.config.ts,
 * incluindo aqueles regenerados automaticamente pelo Leap
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';

export function envLoaderPlugin(): Plugin {
  return {
    name: 'env-loader',
    config(config, { mode }) {
      const envPath = resolve(process.cwd(), '.env');
      
      console.log('========================================');
      console.log('🔍 ENV LOADER PLUGIN');
      console.log('========================================');
      console.log('Mode:', mode);
      console.log('CWD:', process.cwd());
      console.log('Env file:', envPath);
      console.log('Exists:', existsSync(envPath));
      
      // Se o arquivo .env existe, carrega manualmente
      if (existsSync(envPath)) {
        const envContent = readFileSync(envPath, 'utf-8');
        const envVars: Record<string, string> = {};
        
        // Parse simples do .env
        envContent.split('\n').forEach(line => {
          line = line.trim();
          if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length) {
              const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
              envVars[key.trim()] = value;
              
              // Inject into process.env for Vite to pick up
              if (!process.env[key.trim()]) {
                process.env[key.trim()] = value;
              }
            }
          }
        });
        
        console.log('');
        console.log('🔑 Loaded environment variables:');
        Object.keys(envVars).forEach(key => {
          if (key.startsWith('VITE_')) {
            const value = envVars[key];
            const display = value.length > 20 ? `${value.slice(0, 20)}...` : value;
            console.log(`  ${key}: ✅ ${display}`);
          }
        });
        
        // Return define configuration to inject into build
        const define: Record<string, string> = {};
        Object.keys(envVars).forEach(key => {
          if (key.startsWith('VITE_')) {
            define[`import.meta.env.${key}`] = JSON.stringify(envVars[key]);
          }
        });
        
        console.log('');
        console.log('✅ Injecting via define:', Object.keys(define));
        console.log('========================================');
        console.log('');
        
        return {
          define,
        };
      } else {
        console.log('⚠️  No .env file found, using process.env only');
        console.log('========================================');
        console.log('');
      }
      
      return {};
    },
  };
}
