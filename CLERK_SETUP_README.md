# Clerk Authentication Setup - MagikTools

Este documento descreve a implementação de autenticação Clerk com separação completa entre ambientes de desenvolvimento e produção, sem uso de Satellites.

## 📋 Arquitetura

### Ambientes

- **Development/Preview/Staging**: Utiliza instância Development do Clerk com hosts `*.lp.dev` e `*.encr.app`
- **Production**: Utiliza instância Production do Clerk com domínio customizado `app.magik.tools`

### Política de Domínios

**Produção:**
- Frontend: `app.magik.tools`
- Frontend API: `clerk.magik.tools` (DNS já verificado)

**Development/Preview/Staging:**
- Hosts: `*.lp.dev` e `*.encr.app`
- Frontend API: `<subdominio>.clerk.accounts.dev` (sem DNS custom)

## 🔑 Variáveis de Ambiente

### Frontend (.env)

```bash
# Produção (pk_live_* e clerk.magik.tools)
VITE_CLERK_PUBLISHABLE_KEY_LIVE=pk_live_...
VITE_CLERK_FRONTEND_API_LIVE=clerk.magik.tools

# Development/Preview/Staging (pk_test_* e *.clerk.accounts.dev)
VITE_CLERK_PUBLISHABLE_KEY_TEST=pk_test_...
VITE_CLERK_FRONTEND_API_TEST=<seu-subdominio>.clerk.accounts.dev

# Opcional - apenas para desenvolvimento local
VITE_DISABLE_AUTH=0
```

### Backend (Encore Secrets)

Configure separadamente por ambiente usando `encore secret set`:

```bash
# Development/Preview/Staging
encore secret set --type dev ClerkSecretKey
# Cole: sk_test_...

# Production
encore secret set --type prod ClerkSecretKey
# Cole: sk_live_...
```

**Importante:** 
- O `DevAuthBypass` existe apenas para testes locais sem Clerk
- Nunca exponha `sk_*` no frontend
- Se `VITE_DISABLE_AUTH=1`, certifique-se que o backend também aceita `X-Dev-Auth` header

## 🏗️ Estrutura de Arquivos

### Frontend

```
frontend/
├── auth/
│   └── clerk.tsx              # Configuração dev/prod por hostname
├── pages/
│   ├── SignIn.tsx             # Página de login (/sign-in)
│   ├── SignUp.tsx             # Página de cadastro (/sign-up)
│   └── UserProfile.tsx        # Página de perfil (/user)
├── lib/
│   ├── useAuth.ts             # Hook wrapper do Clerk (com bypass dev)
│   └── useBackend.ts          # Hook para injeção automática de token
├── config.ts                  # Configuração central (lê env vars)
└── App.tsx                    # Router com ClerkProvider
```

### Backend

```
backend/
└── auth/
    ├── encore.service.ts      # Definição do serviço
    ├── auth.ts                # Auth handler (verifica JWT Clerk)
    ├── clerk.secrets.ts       # Secrets do Clerk
    ├── clerk.webhook.ts       # Webhook handler (opcional)
    ├── verifySession.ts       # Utilitário de verificação
    └── getCurrentUser.ts      # Helper para obter user do contexto
```

## 🔐 Como Funciona

### Frontend

1. **Seleção de Ambiente** (`frontend/config.ts`):
   - Detecta se hostname é `app.magik.tools` → usa keys `_LIVE`
   - Caso contrário → usa keys `_TEST`

2. **ClerkProvider** (`frontend/App.tsx`):
   ```tsx
   <ClerkProvider
     publishableKey={PUBLISHABLE_KEY}
     {...(FRONTEND_API ? { frontendApi: FRONTEND_API } : {})}
     signInFallbackRedirectUrl="/dashboard"
     signUpFallbackRedirectUrl="/dashboard"
   >
   ```

3. **Rotas de Auth**:
   - `/sign-in` - componente `<SignIn />`
   - `/sign-up` - componente `<SignUp />`
   - `/user` - componente `<UserProfile />`

4. **Proteção de Rotas**:
   ```tsx
   <ProtectedRoute>
     <Dashboard />
   </ProtectedRoute>
   ```
   - Usa `<SignedIn>` e `<SignedOut>` internamente
   - Redireciona para `/sign-in` se não autenticado

5. **Chamadas ao Backend** (`useBackend` hook):
   ```tsx
   const { fetchWithAuth } = useBackend();
   const response = await fetchWithAuth('/api/endpoint', { method: 'POST', ... });
   ```
   - Injeta automaticamente `Authorization: Bearer <token>`
   - Se `DISABLE_AUTH=1`, injeta `X-Dev-Auth: 1`

### Backend

1. **Auth Handler** (`backend/auth/auth.ts`):
   - Recebe token via header `Authorization: Bearer <token>`
   - Verifica JWT usando `@clerk/backend.verifyToken()`
   - Busca dados do usuário via `clerkClient.users.getUser()`
   - Retorna `AuthData { userID, imageUrl, email }`

2. **Dev Bypass** (apenas dev local):
   ```typescript
   if (devAuthBypass() === "1" && data["x-dev-auth"] === "1") {
     return { userID: "dev-user", imageUrl: "", email: "dev@local" };
   }
   ```

3. **Proteção de Endpoints**:
   - Use `auth` authHandler nos endpoints sensíveis
   - Acesse user via `getCurrentUser()` helper

4. **getCurrentUser** (`backend/auth/getCurrentUser.ts`):
   ```typescript
   import { getCurrentUser } from "./auth/getCurrentUser";
   
   const user = getCurrentUser(); // { userID, imageUrl, email }
   ```

## 🎯 Configuração no Clerk Dashboard

### Development Instance (pk_test_*)

**Allowed Origins / URLs:**
- `https://*.lp.dev`
- `https://*.encr.app`
- `http://localhost:*` (para testes locais)

**Frontend API:**
- `<seu-subdominio>.clerk.accounts.dev`

### Production Instance (pk_live_*)

**Allowed Origins:**
- `https://app.magik.tools`

**Frontend API:**
- `clerk.magik.tools` (DNS já verificado)

**Home URL:**
- `https://app.magik.tools/dashboard`

**Sign-in / Sign-up redirects:**
- `/dashboard`

## 🧪 Validação & QA

### Checklist de Testes

- [ ] **Dev (*.lp.dev)**: Login funciona com `pk_test_*`
- [ ] **Dev (*.lp.dev)**: Rotas protegidas redirecionam para `/sign-in`
- [ ] **Dev (*.lp.dev)**: Token JWT válido chega no backend
- [ ] **Dev (*.lp.dev)**: `getCurrentUser()` retorna dados corretos

- [ ] **Prod (app.magik.tools)**: Login funciona com `pk_live_*`
- [ ] **Prod (app.magik.tools)**: Rotas protegidas redirecionam para `/sign-in`
- [ ] **Prod (app.magik.tools)**: Token JWT válido chega no backend
- [ ] **Prod (app.magik.tools)**: Frontend API usa `clerk.magik.tools`

- [ ] **Segurança**: Nenhum `sk_*` aparece no bundle frontend
- [ ] **Segurança**: Endpoints sem auth retornam 401
- [ ] **UX**: Shift+Enter quebra linha nas textareas
- [ ] **UX**: Enter envia mensagem nas textareas

### Como Testar Localmente

1. Configure variáveis no arquivo `.env` (frontend):
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY_TEST=pk_test_...
   VITE_CLERK_FRONTEND_API_TEST=<subdominio>.clerk.accounts.dev
   ```

2. Configure secrets (backend):
   ```bash
   encore secret set --type dev ClerkSecretKey
   # Cole sk_test_...
   ```

3. Execute a aplicação:
   ```bash
   # Leap executa automaticamente
   # Acesse via preview URL fornecida
   ```

4. Teste o fluxo:
   - Visite uma rota protegida → deve redirecionar para `/sign-in`
   - Faça login → deve redirecionar para `/dashboard`
   - Acesse `/user` → deve mostrar perfil do usuário
   - Abra DevTools → verifique que requests têm `Authorization: Bearer ...`

### Como Testar em Produção

1. Configure variáveis no ambiente de produção:
   ```bash
   # Via Leap Dashboard ou deployment settings
   VITE_CLERK_PUBLISHABLE_KEY_LIVE=pk_live_...
   VITE_CLERK_FRONTEND_API_LIVE=clerk.magik.tools
   ```

2. Configure secret de produção:
   ```bash
   encore secret set --type prod ClerkSecretKey
   # Cole sk_live_...
   ```

3. Deploy e acesse `https://app.magik.tools`

4. Repita testes do checklist

## 🚀 Deploy

### Development/Staging

Leap automaticamente:
- Lê `VITE_CLERK_PUBLISHABLE_KEY_TEST` e `VITE_CLERK_FRONTEND_API_TEST`
- Usa secret `ClerkSecretKey` do ambiente `dev`
- Hosts `*.lp.dev` e `*.encr.app` são permitidos

### Production

1. Certifique-se que as variáveis `_LIVE` estão configuradas
2. Configure secret `ClerkSecretKey` tipo `prod`
3. Verifique que DNS `clerk.magik.tools` está apontado corretamente
4. No Clerk Production Instance:
   - Home URL: `https://app.magik.tools/dashboard`
   - Allowed origins: apenas `https://app.magik.tools`

## 🛠️ Troubleshooting

### Erro: "Missing publishable key"

**Causa:** Variável de ambiente não configurada  
**Solução:** Verifique que `VITE_CLERK_PUBLISHABLE_KEY_LIVE` ou `VITE_CLERK_PUBLISHABLE_KEY_TEST` está definida

### Erro: "Invalid token" no backend

**Causa:** Secret key incorreta ou token expirado  
**Solução:** 
- Verifique que `ClerkSecretKey` está configurada corretamente no ambiente
- Confirme que está usando a key correspondente (test com test, live com live)
- Faça logout e login novamente

### Login redireciona para URL errada

**Causa:** Frontend API ou allowed origins incorretos  
**Solução:**
- Development: verifique `VITE_CLERK_FRONTEND_API_TEST` = `<sub>.clerk.accounts.dev`
- Production: verifique `VITE_CLERK_FRONTEND_API_LIVE` = `clerk.magik.tools`
- Confirme allowed origins no Clerk Dashboard

### sk_* aparece no frontend bundle

**Causa:** Secret vazou para código frontend  
**Solução:** 
- **NUNCA** use `import.meta.env.VITE_CLERK_SECRET_KEY`
- Secrets devem ficar apenas no backend
- Use apenas `publishableKey` e `frontendApi` no frontend

## 📚 Referências

- [Leap Docs - Authentication](https://docs.leap.new/tutorials/authentication)
- [Clerk - Production Deployment](https://clerk.com/docs/guides/development/deployment/production)
- [Clerk - Frontend API](https://clerk.com/docs/deployments/set-up-your-frontend-api)
- [Encore.ts - Auth Handler](https://encore.dev/docs/ts/develop/auth)

## 💡 Notas Importantes

1. **Não usar Satellites**: Configuração usa apenas 1 Production e 1 Development instance
2. **Shift+Enter**: Implementado em `ChatLayout.tsx` (linha 62-69)
3. **Enter envia**: Implementado automaticamente (submit do form)
4. **Token injection**: Automático via `useBackend()` hook
5. **Dev bypass**: Apenas para desenvolvimento local, nunca em produção
6. **Frontend API**: Obrigatório para custom domains em produção

---

**Última atualização:** 2025-10-22
