# Gestão de Chaves Clerk - Documentação

## Visão Geral

Este documento descreve como as chaves do Clerk são geridas e utilizadas no projeto, permitindo o uso de chaves de produção (`pk_live_...`) em domínios de produção (`*.magik.tools`) e chaves de teste (`pk_test_...`) em ambientes de preview (`*.lp.dev`).

## Estrutura de Chaves

### Frontend (Cliente - Público)

**Tipo:** Publishable Keys (chaves públicas, seguras para exposição no cliente)

**Chaves Utilizadas:**

1. **Produção** (`pk_live_...`):
   - Usada quando o hostname corresponde a `*.magik.tools`
   - Configurada em: `frontend/.env.production`
   - Variável: `VITE_CLERK_PUBLISHABLE_KEY`

2. **Desenvolvimento/Preview** (`pk_test_...`):
   - Usada quando o hostname **NÃO** corresponde a `*.magik.tools` (ex: `*.lp.dev`)
   - Configurada em: `frontend/.env.development`
   - Variável: `VITE_CLERK_PUBLISHABLE_KEY_DEV`

**Consumidor:** `ClerkProvider` do `@clerk/clerk-react`

**Localização:** `frontend/config.ts` e `frontend/App.tsx`

### Backend (Servidor - Privado)

**Tipo:** Secret Keys (chaves secretas, nunca expostas ao cliente)

**Chave Utilizada:**

- **ClerkSecretKey**: `sk_live_...` ou `sk_test_...`
- Configurada via: **Secrets do Leap** (ambiente privado)
- Variável: `ClerkSecretKey` (secret do Encore)

**Consumidor:** `@clerk/backend` (`createClerkClient`, `verifyToken`)

**Localização:** `backend/auth/auth.ts`

## Implementação

### 1. Arquivos de Ambiente (Frontend)

#### `frontend/.env.production`
```env
# Clerk Publishable Key for Production (*.magik.tools)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsubWFnaWsudG9vbHMk
```

#### `frontend/.env.development`
```env
# Clerk Publishable Key for Development/Preview (*.lp.dev)
VITE_CLERK_PUBLISHABLE_KEY_DEV=pk_test_YYYYYYYYYYYYYYYY
```

### 2. Lógica de Switch (Frontend)

**Arquivo:** `frontend/config.ts`

```typescript
const isProdHost = typeof window !== 'undefined' && /\.magik\.tools$/i.test(window.location.hostname);

const PUBLISHABLE_KEY = isProdHost
  ? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY           // pk_live (produção)
  : import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_DEV;      // pk_test (preview/dev)

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk publishable key for this environment");
}

export const config = {
  clerk: {
    publishableKey: PUBLISHABLE_KEY,
  },
};
```

**Arquivo:** `frontend/App.tsx`

```typescript
import { ClerkProvider } from '@clerk/clerk-react';
import { config } from './config';

const PUBLISHABLE_KEY = config.clerk.publishableKey;

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      {/* ... */}
    </ClerkProvider>
  );
}
```

### 3. Backend (Uso de Secret)

**Arquivo:** `backend/auth/auth.ts`

```typescript
import { createClerkClient, verifyToken } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const verifiedToken = await verifyToken(token, {
        secretKey: clerkSecretKey(),
      });
      
      const user = await clerkClient.users.getUser(verifiedToken.sub);
      return {
        userID: user.id,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0]?.emailAddress ?? null,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err as Error);
    }
  }
);
```

## Como Funciona

### Fluxo de Seleção de Chave (Frontend)

1. **Detecção de ambiente:** A aplicação verifica o `window.location.hostname` em runtime
2. **Seleção de chave:**
   - Se o hostname termina com `.magik.tools` → usa `VITE_CLERK_PUBLISHABLE_KEY` (pk_live)
   - Caso contrário (ex: `.lp.dev`) → usa `VITE_CLERK_PUBLISHABLE_KEY_DEV` (pk_test)
3. **Validação:** Se nenhuma chave estiver disponível, lança erro

### Fluxo de Autenticação (Backend)

1. O frontend envia o token JWT do Clerk no header `Authorization`
2. O backend usa `ClerkSecretKey` (configurado via Secrets do Leap) para verificar o token
3. O backend obtém os dados do usuário via `clerkClient.users.getUser()`

## Configuração de Secrets (Leap)

Para configurar o `ClerkSecretKey` no backend:

1. Abra **Settings** na barra lateral do Leap
2. Adicione um novo secret:
   - Nome: `ClerkSecretKey`
   - Valor: `sk_live_...` (produção) ou `sk_test_...` (desenvolvimento)

## Resolução de Problemas

### Erro: "Production Keys are only allowed for domain 'magik.tools'"

**Causa:** Chave `pk_live_...` sendo usada em domínio não autorizado (ex: `*.lp.dev`)

**Solução:** 
1. Verifique se `frontend/.env.development` contém `VITE_CLERK_PUBLISHABLE_KEY_DEV=pk_test_...`
2. Certifique-se de que a lógica de switch em `frontend/config.ts` está correta
3. Limpe o cache do navegador e recarregue a aplicação

### Erro: "Missing Clerk publishable key for this environment"

**Causa:** Variável de ambiente não configurada

**Solução:**
1. Verifique se os arquivos `.env.production` e `.env.development` existem em `/frontend/`
2. Certifique-se de que as variáveis estão corretamente definidas
3. Rebuild a aplicação para carregar as novas variáveis

## Checklist de Segurança

- ✅ Chaves secretas (`sk_live_...`, `sk_test_...`) **nunca** expostas no frontend
- ✅ Chaves públicas (`pk_live_...`, `pk_test_...`) usadas apenas no frontend
- ✅ Secrets geridos via sistema de Secrets do Leap (backend)
- ✅ Zero hardcoded keys no código fonte
- ✅ Alternância automática baseada em hostname
- ✅ Validação de presença de chaves em tempo de execução

## Arquivos Modificados

- `frontend/.env.production` (criado)
- `frontend/.env.development` (criado)
- `frontend/config.ts` (modificado - adicionada lógica de switch)
- `backend/auth/auth.ts` (verificado - já usa secrets corretamente)
- `CLERK_KEYS_DOCUMENTATION.md` (criado)

## Manutenção

### Atualização de Chaves

**Frontend:**
1. Edite `frontend/.env.production` ou `frontend/.env.development`
2. Rebuild a aplicação

**Backend:**
1. Abra Settings no Leap
2. Atualize o valor do secret `ClerkSecretKey`
3. Redeploy a aplicação (automático no Leap)

### Adição de Novos Ambientes

Se precisar adicionar suporte para outro domínio:

1. Edite `frontend/config.ts`
2. Atualize a regex `isProdHost` para incluir o novo domínio
3. Adicione nova variável de ambiente se necessário
