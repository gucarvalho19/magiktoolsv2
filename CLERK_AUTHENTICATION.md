# Autenticação Clerk - Guia de Configuração

**Última atualização:** 2025-10-23
**Status:** Documentação oficial e consolidada

---

## Visão Geral

Este projeto usa Clerk para autenticação de usuários, integrado com:
- **Frontend:** React + Vite (hospedado no Leap)
- **Backend:** Encore (TypeScript)
- **Infraestrutura:** Leap gerencia deploys, Encore gerencia backend e secrets

---

## Arquitetura de Autenticação

```
┌─────────────┐                 ┌──────────────┐                ┌─────────────┐
│   Browser   │────── HTTPS ────▶│   Frontend   │──── Bearer ───▶│   Backend   │
│             │                 │  (Clerk SDK)  │     Token      │  (Encore)   │
└─────────────┘                 └──────────────┘                └─────────────┘
       │                               │                                │
       │                               │                                │
       └────── OAuth/Sign-in ──────────┼───────────────────────────────┼────▶ Clerk
                                       │                                │
                             (pk_live_/pk_test_)              (sk_live_/sk_test_)
```

---

## Configuração de Variáveis de Ambiente

### Frontend

O frontend usa **detecção automática de ambiente** baseada no hostname:

- **Produção:** `window.location.hostname === 'app.magik.tools'` → usa variáveis `_LIVE`
- **Desenvolvimento:** qualquer outro hostname → usa variáveis `_TEST`

#### Variáveis requeridas:

**Produção (app.magik.tools):**
```env
VITE_CLERK_PUBLISHABLE_KEY_LIVE=pk_live_Y2xlcmsubWFnaWsudG9vbHMk
VITE_CLERK_FRONTEND_API_LIVE=clerk.magik.tools
VITE_DISABLE_AUTH=0
```

**Desenvolvimento (*.lp.dev, *.encr.app, localhost):**
```env
VITE_CLERK_PUBLISHABLE_KEY_TEST=pk_test_[SUA_CHAVE_AQUI]
VITE_CLERK_FRONTEND_API_TEST=[SEU_SUBDOMINIO].clerk.accounts.dev
VITE_DISABLE_AUTH=0
```

**Desenvolvimento local (opcional - sem Clerk):**
```env
VITE_DISABLE_AUTH=1
VITE_CLIENT_TARGET=http://localhost:4000
```

#### Configuração no Leap:

1. Acesse **Settings > Environment Variables** no Leap
2. Para produção, adicione:
   - `VITE_CLERK_PUBLISHABLE_KEY_LIVE`
   - `VITE_CLERK_FRONTEND_API_LIVE`
3. Para preview/staging, adicione:
   - `VITE_CLERK_PUBLISHABLE_KEY_TEST`
   - `VITE_CLERK_FRONTEND_API_TEST`

### Backend

O backend usa **Encore Secrets** para gerenciar chaves secretas.

#### Secrets requeridos:

**ClerkSecretKey:**
- Produção: `sk_live_...`
- Development: `sk_test_...`

**DevAuthBypass (opcional, apenas dev local):**
- `"1"` para habilitar bypass de autenticação

#### Configuração via Encore CLI:

```bash
# Development
encore secret set --type dev ClerkSecretKey
# Cole quando solicitado: sk_test_...

# Production
encore secret set --type prod ClerkSecretKey
# Cole quando solicitado: sk_live_...

# Dev bypass (opcional, apenas desenvolvimento local)
encore secret set --type dev DevAuthBypass
# Digite: 1
```

---

## Obtenção de Chaves Clerk

### 1. Acesse o Clerk Dashboard

https://dashboard.clerk.com

### 2. Instâncias separadas

**IMPORTANTE:** Use instâncias separadas para produção e desenvolvimento:

- **Production Instance:** Para `app.magik.tools`
- **Development Instance:** Para `*.lp.dev`, `*.encr.app`, localhost

### 3. Configuração de domínios

**Production Instance:**

1. **API Keys:**
   - Copie `Publishable key` → `VITE_CLERK_PUBLISHABLE_KEY_LIVE`
   - Copie `Secret key` → Use no `encore secret set --type prod`

2. **Domains:**
   - Allowed origins: `https://app.magik.tools`
   - Frontend API: `clerk.magik.tools` (custom domain)

3. **Paths:**
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - Home URL: `https://app.magik.tools/dashboard`

**Development Instance:**

1. **API Keys:**
   - Copie `Publishable key` → `VITE_CLERK_PUBLISHABLE_KEY_TEST`
   - Copie `Secret key` → Use no `encore secret set --type dev`

2. **Domains:**
   - Allowed origins:
     - `https://*.lp.dev`
     - `https://*.encr.app`
     - `http://localhost:*`

3. **Frontend API:**
   - Use o padrão `[seu-app].clerk.accounts.dev`
   - Copie para `VITE_CLERK_FRONTEND_API_TEST`

---

## Implementação

### Frontend

#### 1. Configuração central (frontend/config.ts)

```typescript
const isProd = typeof window !== 'undefined' && window.location.hostname === 'app.magik.tools';

const PUBLISHABLE_KEY = isProd
  ? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_LIVE || ''
  : import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_TEST || '';

const FRONTEND_API = isProd
  ? import.meta.env.VITE_CLERK_FRONTEND_API_LIVE || ''
  : import.meta.env.VITE_CLERK_FRONTEND_API_TEST || '';
```

#### 2. Provider (frontend/App.tsx)

```typescript
<ClerkProvider
  publishableKey={PUBLISHABLE_KEY}
  {...(FRONTEND_API ? { frontendApi: FRONTEND_API } : {})}
  signInFallbackRedirectUrl="/dashboard"
  signUpFallbackRedirectUrl="/dashboard"
>
  <AppContent />
</ClerkProvider>
```

#### 3. Proteção de rotas

```typescript
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

#### 4. Integração com backend (frontend/lib/useBackend.ts)

```typescript
const { getToken } = useAuth();

return backend.with({
  auth: async () => {
    const token = await getToken();
    return { authorization: `Bearer ${token}` };
  }
});
```

### Backend

#### 1. Auth handler (backend/auth/auth.ts)

```typescript
import { createClerkClient, verifyToken } from "@clerk/backend";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    const verifiedToken = await verifyToken(token, {
      secretKey: clerkSecretKey(),
    });

    const user = await clerkClient.users.getUser(verifiedToken.sub);
    return {
      userID: user.id,
      imageUrl: user.imageUrl,
      email: user.emailAddresses[0]?.emailAddress ?? null,
    };
  }
);
```

#### 2. Endpoints protegidos

```typescript
export const getMembership = api<void, MembershipResponse>(
  { method: "GET", path: "/me/membership", expose: true, auth: true },
  async () => {
    const auth = getAuthData();
    // ... implementação
  }
);
```

---

## Fluxo de Autenticação

### Sign-in

1. Usuário acessa rota protegida
2. `<SignedOut>` detecta ausência de sessão
3. Redireciona para `/sign-in`
4. Clerk exibe UI de login
5. Após sucesso, redireciona para `/dashboard`

### Chamada ao backend

1. Frontend obtém token: `const token = await getToken()`
2. Injeta no header: `Authorization: Bearer ${token}`
3. Backend recebe e verifica: `verifyToken(token, { secretKey })`
4. Backend busca dados: `clerkClient.users.getUser(userId)`
5. Retorna `AuthData` para endpoint

### Logout

```typescript
import { useClerk } from './lib/useAuth';

const { signOut } = useClerk();
await signOut();
```

---

## Ambientes

### Produção (app.magik.tools)

- **Frontend:** Hospedado no Leap
- **Backend:** Encore em produção
- **Chaves:** `pk_live_...` e `sk_live_...`
- **Frontend API:** `clerk.magik.tools`

### Development/Staging (*.lp.dev, *.encr.app)

- **Frontend:** Preview do Leap
- **Backend:** Encore em dev
- **Chaves:** `pk_test_...` e `sk_test_...`
- **Frontend API:** `*.clerk.accounts.dev`

### Local (localhost)

**Com autenticação:**
- Configure `VITE_CLERK_PUBLISHABLE_KEY_TEST` e `VITE_CLERK_FRONTEND_API_TEST`
- Configure `ClerkSecretKey` via `encore secret set --type dev`

**Sem autenticação (bypass):**
- `VITE_DISABLE_AUTH=1` no frontend
- `DevAuthBypass=1` no backend
- Frontend envia `X-Dev-Auth: 1` header
- Backend retorna usuário fictício

---

## Segurança

### Checklist

- ✅ Chaves secretas (`sk_`) **nunca** expostas no frontend
- ✅ Chaves públicas (`pk_`) **apenas** no frontend
- ✅ Secrets gerenciados via Encore (não hardcoded)
- ✅ Tokens JWT validados no backend
- ✅ HTTPS em produção
- ✅ Separação de ambientes (dev/prod)

### Boas práticas

1. **Nunca commite chaves secretas** no Git
2. **Rode secrets apenas via Encore CLI** (`encore secret set`)
3. **Use instâncias separadas** do Clerk (dev/prod)
4. **Valide todos os tokens** no backend
5. **Use HTTPS** em todos os ambientes (exceto localhost)

---

## Troubleshooting

### Erro: "VITE_CLERK_PUBLISHABLE_KEY_LIVE is required but not defined"

**Causa:** Variável de ambiente não configurada
**Solução:**
1. Verifique que está acessando via hostname correto (`app.magik.tools`)
2. Configure `VITE_CLERK_PUBLISHABLE_KEY_LIVE` no Leap Settings
3. Faça rebuild da aplicação

### Erro: "Invalid token" no backend

**Causa:** Secret key incorreta ou token expirado
**Solução:**
1. Verifique que `ClerkSecretKey` está configurado: `encore secret list`
2. Certifique-se de usar chaves correspondentes (test com test, live com live)
3. Faça logout e login novamente

### Login redireciona para URL errada

**Causa:** Frontend API incorreta
**Solução:**
1. Verifique `VITE_CLERK_FRONTEND_API_LIVE` ou `_TEST`
2. Confirme que o domínio está verificado no Clerk Dashboard
3. Limpe cache do navegador

### "Development mode" aparece em produção

**Causa:** Build usando variáveis erradas
**Solução:**
1. Verifique que `.env.production` contém `_LIVE` keys
2. Force rebuild: `cd frontend && vite build`
3. Limpe cache do CDN/Leap

---

## Verificação

### Checklist de deploy

**Antes de fazer deploy em produção:**

- [ ] `VITE_CLERK_PUBLISHABLE_KEY_LIVE` configurado no Leap
- [ ] `VITE_CLERK_FRONTEND_API_LIVE` configurado no Leap
- [ ] `ClerkSecretKey` tipo `prod` configurado via Encore
- [ ] Clerk Production Instance tem `app.magik.tools` em allowed origins
- [ ] DNS `clerk.magik.tools` está apontado corretamente
- [ ] Build testado localmente
- [ ] Login/logout funcionando
- [ ] Chamadas ao backend autenticadas com sucesso

**Após deploy:**

1. Acesse `https://app.magik.tools`
2. Verifique redirecionamento para login
3. Faça login
4. Verifique redirecionamento para `/dashboard`
5. Abra DevTools > Network > veja headers `Authorization: Bearer ...`
6. Teste logout

---

## Dependências

**Frontend:**
```json
{
  "@clerk/clerk-react": "^5.35.2",
  "encore.dev": "^1.50.6"
}
```

**Backend:**
```json
{
  "@clerk/backend": "^1.27.0",
  "encore.dev": "^1.50.6"
}
```

---

## Referências

- [Clerk Docs](https://clerk.com/docs)
- [Encore Docs - Auth](https://encore.dev/docs/ts/develop/auth)
- [Leap Docs](https://docs.leap.new/)

---

## Changelog

**2025-10-23:**
- Consolidação de documentação
- Correção de nomes de variáveis (`_LIVE` e `_TEST`)
- Atualização de `.env.example`, `.env.production`, `.env.development`
- Adição de diagramas e fluxos
