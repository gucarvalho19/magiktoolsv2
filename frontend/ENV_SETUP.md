# 🔧 Configuração de Variáveis de Ambiente

## Problema

O Leap regenera automaticamente o `vite.config.ts` durante builds/deploys, sobrescrevendo qualquer customização.

## Solução

Use um arquivo `.env` local que o Vite carrega automaticamente.

## Setup

1. **Crie um arquivo `.env` na pasta `/frontend`:**

```bash
cd /frontend
cp .env.example .env
```

2. **Edite o `.env` com suas credenciais do Clerk:**

```env
# Desenvolvimento/Preview
VITE_CLERK_PUBLISHABLE_KEY_TEST=pk_test_SEU_VALOR_AQUI
VITE_CLERK_FRONTEND_API_TEST=

# Produção (app.magik.tools)
VITE_CLERK_PUBLISHABLE_KEY_LIVE=pk_live_SEU_VALOR_AQUI
VITE_CLERK_FRONTEND_API_LIVE=

# Backend target (geralmente deixar como /)
VITE_CLIENT_TARGET=/

# Dev mode - desabilita auth (opcional)
# VITE_DISABLE_AUTH=1
```

## Como Funciona

O Vite **automaticamente** carrega arquivos `.env` e disponibiliza variáveis que começam com `VITE_` via `import.meta.env`.

Isso funciona mesmo se o Leap regenerar o `vite.config.ts`, porque é um comportamento nativo do Vite.

## Importante

- ⚠️ **NUNCA commite o arquivo `.env`** - ele deve estar no `.gitignore`
- ✅ Sempre use o prefixo `VITE_` para variáveis do frontend
- ✅ Valores vazios são OK (sistema usa fallbacks inteligentes)

## Deployment em Produção

Para produção no Leap, configure as variáveis via:
1. **Settings** no sidebar do Leap
2. Adicione os secrets com os mesmos nomes (sem o prefixo `VITE_`)
3. O Leap automaticamente injeta eles como variáveis de ambiente

## Verificação

Para verificar se está funcionando, olhe os logs do console no navegador:

```
🔧 Config loaded: {
  environment: 'development',
  publishableKeyPrefix: 'pk_test_...',
  ...
}
```

## Alternativa: Plugin Customizado (Avançado)

Se precisar de mais controle, use o plugin em `/frontend/vite-plugin-env-loader.ts`:

```ts
// No vite.config.ts (se você tiver controle sobre ele)
import { envLoaderPlugin } from './vite-plugin-env-loader';

export default defineConfig({
  plugins: [envLoaderPlugin(), react(), tailwindcss()],
});
```

Mas lembre-se: o Leap pode regenerar o `vite.config.ts`, então o `.env` nativo é mais confiável.
