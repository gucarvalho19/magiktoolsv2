# Gestão de Chaves Clerk - Documentação

## Visão Geral

Este documento descreve como as chaves do Clerk são geridas e utilizadas no projeto. A aplicação utiliza **uma única variável de ambiente** (`VITE_CLERK_PUBLISHABLE_KEY`) configurada de acordo com o ambiente de execução (desenvolvimento/preview ou produção).

## Estrutura de Chaves

### Frontend (Cliente - Público)

**Tipo:** Publishable Keys (chaves públicas, seguras para exposição no cliente)

**Chave Utilizada:**

- **Variável única:** `VITE_CLERK_PUBLISHABLE_KEY`
  - Para **desenvolvimento/preview**: deve conter uma chave de teste (`pk_test_...`)
  - Para **produção**: deve conter uma chave de produção (`pk_live_...`)
  - **Obrigatória**: A aplicação gerará erro em build-time ou runtime se não estiver definida (exceto quando `VITE_DISABLE_AUTH=1`)

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

### 1. Configuração de Ambiente (Frontend)

**IMPORTANTE:** Não há mais lógica de runtime para alternar entre chaves. A aplicação usa **apenas** `VITE_CLERK_PUBLISHABLE_KEY`, que deve ser configurada pelo ambiente de deploy:

- **Desenvolvimento/Preview (*.lp.dev):** Defina `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...` 
- **Produção (*.magik.tools):** Defina `VITE_CLERK_PUBLISHABLE_KEY=pk_live_...`

### 2. Validação de Chave (Frontend)

**Arquivo:** `frontend/config.ts`

```typescript
const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === '1';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

if (!DISABLE_AUTH && !PUBLISHABLE_KEY) {
  throw new Error(
    '[Clerk Config Error] VITE_CLERK_PUBLISHABLE_KEY is required but not defined. ' +
    'Please set this environment variable with your Clerk publishable key ' +
    '(pk_test_... for development/preview or pk_live_... for production).'
  );
}

export const config = {
  disableAuth: DISABLE_AUTH,
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
  if (config.disableAuth) {
    return <AppContent />;
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AppContent />
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

### Fluxo de Configuração (Frontend)

1. **Build-time/Runtime:** A aplicação lê `VITE_CLERK_PUBLISHABLE_KEY` das variáveis de ambiente
2. **Validação:** Se a chave não estiver definida (e `VITE_DISABLE_AUTH !== '1'`), a aplicação lança erro imediatamente
3. **Uso:** A chave é passada diretamente para o `ClerkProvider` sem lógica de switching

### Fluxo de Autenticação (Backend)

1. O frontend envia o token JWT do Clerk no header `Authorization`
2. O backend usa `ClerkSecretKey` (configurado via Secrets do Leap) para verificar o token
3. O backend obtém os dados do usuário via `clerkClient.users.getUser()`

## Configuração de Secrets

### Frontend (Variáveis de Ambiente)

Configure `VITE_CLERK_PUBLISHABLE_KEY` de acordo com o ambiente:

**Desenvolvimento/Preview:**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsubWFnaWsudG9vbHMk
```

**Produção:**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsubWFnaWsudG9vbHMk
```

### Backend (Leap Secrets)

Para configurar o `ClerkSecretKey` no backend:

1. Abra **Settings** na barra lateral do Leap
2. Adicione um novo secret:
   - Nome: `ClerkSecretKey`
   - Valor: `sk_live_...` (produção) ou `sk_test_...` (desenvolvimento)

## Resolução de Problemas

### Erro: "VITE_CLERK_PUBLISHABLE_KEY is required but not defined"

**Causa:** Variável de ambiente não configurada

**Solução:**
1. Certifique-se de que `VITE_CLERK_PUBLISHABLE_KEY` está definida no ambiente de deploy
2. Para desenvolvimento local, crie arquivo `.env` em `/frontend/` com:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
3. Rebuild a aplicação

### Erro: "Production Keys are only allowed for domain 'magik.tools'"

**Causa:** Chave `pk_live_...` sendo usada em domínio não autorizado (ex: `*.lp.dev`)

**Solução:** 
1. Verifique qual chave está configurada em `VITE_CLERK_PUBLISHABLE_KEY`
2. Para ambientes de preview/desenvolvimento, use `pk_test_...`
3. Para produção em `*.magik.tools`, use `pk_live_...`

### Erro: Console mostra "[Clerk Config Error]"

**Causa:** A validação em `config.ts` detectou ausência da chave

**Solução:**
1. Verifique se `VITE_CLERK_PUBLISHABLE_KEY` está configurada
2. Certifique-se de que a variável não está vazia
3. Se estiver usando `VITE_DISABLE_AUTH=1`, ignore este erro (comportamento esperado em modo dev)

## Checklist de Segurança

- ✅ Chaves secretas (`sk_live_...`, `sk_test_...`) **nunca** expostas no frontend
- ✅ Chaves públicas (`pk_live_...`, `pk_test_...`) usadas apenas no frontend
- ✅ Secrets geridos via sistema de Secrets do Leap (backend)
- ✅ Zero hardcoded keys no código fonte
- ✅ Validação de presença de chave em build-time/runtime
- ✅ Erro explícito se chave não estiver configurada
- ✅ Sem lógica de runtime switching (simplificado para configuração por ambiente)

## Mudanças Recentes (2025-10-22)

### O que foi alterado:

1. **Removida lógica de runtime switching:** 
   - Anteriormente, o código verificava `window.location.hostname` para escolher entre `VITE_CLERK_PUBLISHABLE_KEY` e `VITE_CLERK_PUBLISHABLE_KEY_DEV`
   - Agora usa **apenas** `VITE_CLERK_PUBLISHABLE_KEY`, configurada pelo ambiente de deploy

2. **Validação estrita adicionada:**
   - `frontend/config.ts` agora lança erro imediatamente se `VITE_CLERK_PUBLISHABLE_KEY` não estiver definida
   - Erro é descritivo e indica ao desenvolvedor como corrigir o problema

3. **Simplificação do App.tsx:**
   - Removida função `DiagnosticView` (não mais necessária)
   - Removida condicional `if (!PUBLISHABLE_KEY)` no render principal
   - Aplicação agora falha rapidamente (fail-fast) se a configuração estiver incorreta

### Por que foi alterado:

- **Previsibilidade:** Configuração baseada em ambiente é mais previsível que lógica de runtime
- **Segurança:** Reduz chance de usar chave errada por acidente
- **Simplicidade:** Menos código, menos pontos de falha
- **Boas práticas:** Seguindo padrão de 12-factor app (configuração via ambiente)

## Arquivos Modificados

- `frontend/config.ts` (modificado - adicionada validação estrita, removida lógica de switching)
- `frontend/App.tsx` (modificado - removida DiagnosticView e condicional de chave vazia)
- `CLERK_KEYS_DOCUMENTATION.md` (atualizado - reflete nova abordagem)

## Manutenção

### Atualização de Chaves

**Frontend:**
1. Atualize a variável de ambiente `VITE_CLERK_PUBLISHABLE_KEY` no ambiente de deploy
2. Rebuild a aplicação

**Backend:**
1. Abra Settings no Leap
2. Atualize o valor do secret `ClerkSecretKey`
3. Redeploy a aplicação (automático no Leap)

### Adição de Novos Ambientes

Para adicionar suporte para novo ambiente (ex: staging):

1. Configure `VITE_CLERK_PUBLISHABLE_KEY` com a chave apropriada (pk_test_... ou pk_live_...)
2. Configure `ClerkSecretKey` no backend (via Leap Settings)
3. Deploy a aplicação

**Não é necessário modificar código** - a configuração é totalmente baseada em variáveis de ambiente.
