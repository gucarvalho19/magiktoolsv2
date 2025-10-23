# Guia de Configuração de Deployment

Este documento descreve como configurar as variáveis de ambiente e secrets necessários para cada ambiente de deployment.

## ⚠️ Problema Identificado

Os ambientes de preview, staging e produção estão apresentando tela em branco porque **as variáveis de ambiente do Clerk não estão configuradas**.

## 📋 Variáveis de Ambiente Necessárias

### ⚠️ IMPORTANTE: Diferença entre Secrets e Environment Variables no Encore

O Encore tem **duas seções diferentes** para configuração:

1. **Secrets** → Para RUNTIME (código do backend em execução)
   - Exemplo: `ClerkSecretKey`
   - Configurado em: Encore → Settings → **Secrets**

2. **Environment Variables** → Para BUILD TIME (durante o build do frontend)
   - Exemplo: `VITE_*`
   - Configurado em: Encore → Settings → **Environment Variables**

### 🔑 Secrets do Backend (RUNTIME - via Encore Secrets)

Estes são usados pelo backend em execução:

```bash
ClerkSecretKey      # sk_test_... para dev/staging, sk_live_... para produção
DevAuthBypass       # "1" apenas para desenvolvimento local (opcional)
```

**Onde configurar**: Encore Dashboard → Settings → **Secrets**

### 🌐 Environment Variables do Frontend (BUILD TIME - via Encore Environment Variables)

Estas variáveis são injetadas durante o **build do frontend** (quando `vite build` executa):

**Para Desenvolvimento/Staging/Preview:**
```bash
VITE_CLERK_PUBLISHABLE_KEY_TEST=pk_test_...           # Chave pública de teste
VITE_CLERK_FRONTEND_API_TEST=xxxxx.clerk.accounts.dev # Domínio de teste
VITE_CLIENT_TARGET=/                                   # Backend na mesma origem
```

**Para Produção:**
```bash
VITE_CLERK_PUBLISHABLE_KEY_LIVE=pk_live_...     # Chave pública de produção
VITE_CLERK_FRONTEND_API_LIVE=clerk.magik.tools  # Domínio customizado
VITE_CLIENT_TARGET=/                             # Backend na mesma origem
```

## 🚀 Como Configurar (Encore)

### ⚠️ ATENÇÃO: Configuração Correta

**NÃO use Leap Secrets** para as variáveis `VITE_*`. Configure diretamente no **Encore**.

### Por quê?

O script de build do backend executa:
```bash
cd ../frontend && bun install && vite build
```

Durante esse build, o Vite precisa das variáveis `VITE_*` como **environment variables**, não como secrets em runtime.

### Passo a Passo Correto

#### 1. Configurar Environment Variables no Encore (BUILD TIME)

1. Acesse o painel do **Encore**
2. Vá em **Settings → Environment Variables** (NÃO "Secrets")
3. Adicione as seguintes variáveis:

**Para ambientes Preview/Staging/Development:**
- Marque os checkboxes: ✅ Preview, ✅ Staging, ✅ Development
- Adicione:
  ```
  VITE_CLERK_PUBLISHABLE_KEY_TEST → pk_test_c2xlcmsubWFnaWsudG9vbHMk...
  VITE_CLERK_FRONTEND_API_TEST    → correct-seal-12.clerk.accounts.dev
  VITE_CLIENT_TARGET              → /
  ```

**Para ambiente Production:**
- Marque o checkbox: ✅ Production
- Adicione:
  ```
  VITE_CLERK_PUBLISHABLE_KEY_LIVE → pk_live_Y2xlcmsubWFnaWsudG9vbHMk...
  VITE_CLERK_FRONTEND_API_LIVE    → clerk.magik.tools
  VITE_CLIENT_TARGET              → /
  ```

#### 2. Configurar Secrets no Encore (RUNTIME)

1. Ainda no painel do **Encore**
2. Vá em **Settings → Secrets** (agora sim!)
3. Adicione apenas:

**Para ambientes Preview/Staging/Development:**
```
ClerkSecretKey → sk_test_... (chave secreta de teste)
```

**Para ambiente Production:**
```
ClerkSecretKey → sk_live_... (chave secreta de produção)
```

#### 3. Fazer Deploy

Após configurar:
1. Faça um novo deploy no Leap ou trigger um rebuild no Encore
2. O build do frontend terá acesso às variáveis `VITE_*`
3. O backend em runtime terá acesso ao `ClerkSecretKey`

---

## 🔑 Obtendo as Chaves do Clerk

### 1. Chaves de Teste (Development/Staging/Preview)

1. Acesse https://dashboard.clerk.com
2. Selecione sua aplicação
3. Certifique-se de estar no modo **Development** (toggle no topo da página)
4. Vá em **Configure → API Keys**
5. Copie os seguintes valores:
   - **Publishable Key** (começa com `pk_test_...`) → use em `VITE_CLERK_PUBLISHABLE_KEY_TEST`
   - **Secret Key** (começa com `sk_test_...`) → use em `ClerkSecretKey` (ambiente dev)
   - **Frontend API** (termina em `.clerk.accounts.dev`) → use em `VITE_CLERK_FRONTEND_API_TEST`

### 2. Chaves de Produção (Production)

1. No mesmo painel do Clerk, mude para o ambiente **Production** (toggle no topo)
2. Vá em **Configure → API Keys**
3. Copie os seguintes valores:
   - **Publishable Key** (começa com `pk_live_...`) → use em `VITE_CLERK_PUBLISHABLE_KEY_LIVE`
   - **Secret Key** (começa com `sk_live_...`) → use em `ClerkSecretKey` (ambiente prod)
   - **Frontend API** customizado → use em `VITE_CLERK_FRONTEND_API_LIVE`
     - Se você configurou um domínio customizado como `clerk.magik.tools`, use ele
     - Caso contrário, use o domínio padrão fornecido pelo Clerk

---

## 🌍 Ambientes Afetados

### Preview (Leap)
- **URL**: https://saas-hub-dashboard-d35d1c482vjgjdhh8ov0.lp.dev
- **Variáveis necessárias**: Chaves de `_TEST`
- **Como detecta**: Qualquer hostname diferente de `app.magik.tools`

### Staging (Encore)
- **URL**: https://staging-saas-hub-dashboard-e8c2.frontend.encr.app
- **Variáveis necessárias**: Chaves de `_TEST`
- **Como detecta**: Qualquer hostname diferente de `app.magik.tools`

### Produção
- **URL**: https://app.magik.tools
- **Variáveis necessárias**: Chaves de `_LIVE`
- **Como detecta**: Exatamente `window.location.hostname === 'app.magik.tools'`

---

## ✅ Verificação Pós-Deploy

Após configurar os secrets e fazer deploy, verifique:

### 1. Console do Navegador (F12 → Console)

Você deve ver algo como:
```
🔧 Config loaded: {
  environment: 'production' ou 'development',
  hostname: 'app.magik.tools' ou outro,
  disableAuth: false,
  publishableKeyPrefix: 'pk_live_...' ou 'pk_test_...',
  frontendApi: 'clerk.magik.tools' ou '*.clerk.accounts.dev',
  hasError: false
}
```

**✅ Sinal de sucesso**: `hasError: false` e `publishableKeyPrefix` não está `[NOT SET]`

**❌ Sinal de problema**: `hasError: true` ou `publishableKeyPrefix: '[NOT SET]'`

### 2. Tela de Erro vs Tela em Branco

**Antes das correções**: Tela em branco sem nenhuma informação

**Depois das correções**:
- Se configurado corretamente → Tela de login do Clerk
- Se houver erro de configuração → **Tela vermelha** com instruções detalhadas

Se você vir a tela vermelha, leia as instruções nela e verifique os logs do console.

### 3. Login Funcional

Se tudo estiver correto:
1. Você será redirecionado para a tela de login do Clerk
2. Após login, será redirecionado para `/dashboard`
3. O backend conseguirá validar o token JWT

---

## 🐛 Troubleshooting

### Ainda vejo tela em branco após configurar

**Possíveis causas**:

1. **Build antigo em cache**
   - Solução: Force um novo deployment no Leap
   - Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)

2. **Variáveis não foram injetadas no build**
   - Solução: Verifique se as variáveis `VITE_*` estão disponíveis no momento do build
   - No Encore, confirme que os secrets estão configurados para o ambiente correto

3. **Nome das variáveis incorreto**
   - Solução: Confirme que os nomes são **exatamente**:
     - `VITE_CLERK_PUBLISHABLE_KEY_TEST` (não `VITE_CLERK_PUBLISHABLE_KEY_DEV`)
     - `VITE_CLERK_PUBLISHABLE_KEY_LIVE` (não `VITE_CLERK_PUBLISHABLE_KEY_PROD`)
   - Case-sensitive! Devem estar em MAIÚSCULAS

### Erro "Worker threw exception" no Cloudflare/Encore

**Significado**: Erro fatal durante a execução do worker (SSR ou runtime)

**Como diagnosticar**:
1. Acesse os **logs de deployment** no painel do Encore
2. Procure por erros de build ou runtime
3. Verifique se todas as dependências foram instaladas corretamente

**Soluções**:
- Certifique-se de que `VITE_CLIENT_TARGET=/` está configurado
- Verifique se o build do frontend terminou com sucesso
- Confira se não há erros de TypeScript no código

### Tela vermelha de erro de configuração

**Isso é esperado!** A tela vermelha significa que o código está funcionando, mas faltam variáveis.

**O que fazer**:
1. Leia a mensagem de erro na tela (ela indica qual variável está faltando)
2. Veja os logs do console para detalhes adicionais
3. Adicione a variável faltante no Leap → ela aparecerá no Encore
4. Configure o valor correto no Encore para o ambiente específico
5. Faça um novo deploy

### Detecção de ambiente incorreta

**Problema**: O código está usando chaves de produção quando deveria usar teste (ou vice-versa)

**Como verificar**:
- Olhe o console: `environment: 'production'` ou `'development'`
- Olhe o hostname: `hostname: 'app.magik.tools'` (produção) ou outro (teste)

**Solução**:
- A detecção é feita em `frontend/config.ts:3`
- Para produção: `window.location.hostname === 'app.magik.tools'`
- Para todos os outros ambientes (preview, staging, localhost): usa chaves de teste
- Se o hostname de produção for diferente, ajuste o `config.ts`

---

## 📝 Resumo: Fluxo Correto de Configuração

### TL;DR

1. **Obtenha as chaves do Clerk** (dashboard.clerk.com)

2. **No Encore → Environment Variables** (para build do frontend):
   - `VITE_CLERK_PUBLISHABLE_KEY_TEST` (Preview/Staging/Dev)
   - `VITE_CLERK_PUBLISHABLE_KEY_LIVE` (Production)
   - `VITE_CLERK_FRONTEND_API_TEST` (Preview/Staging/Dev)
   - `VITE_CLERK_FRONTEND_API_LIVE` (Production)
   - `VITE_CLIENT_TARGET` (todos os ambientes → valor: `/`)

3. **No Encore → Secrets** (para runtime do backend):
   - `ClerkSecretKey` → `sk_test_...` (Preview/Staging/Dev)
   - `ClerkSecretKey` → `sk_live_...` (Production)

4. **Faça deploy/rebuild**

5. **Verifique** o console do navegador para confirmar configuração

---

## 📝 Alterações Implementadas no Código

As seguintes correções foram feitas no código para melhorar a experiência de deployment:

### 1. frontend/vite.config.ts
- **Antes**: Forçava `mode: "development"` e `minify: false`
- **Depois**: Detecta automaticamente o ambiente e minifica em produção
- **Benefício**: Builds otimizados para produção, builds rápidos para desenvolvimento

### 2. frontend/config.ts
- **Antes**: Lançava `throw new Error()` que causava tela em branco
- **Depois**: Retorna erro como string e loga detalhes no console
- **Benefício**: Aplicação não quebra, permite mostrar tela de erro amigável

### 3. frontend/App.tsx
- **Antes**: Tela em branco sem informação quando havia erro
- **Depois**: Componente `ConfigErrorScreen` com instruções detalhadas
- **Benefício**: Feedback visual claro sobre o que está errado e como corrigir

### 4. DEPLOYMENT_CONFIG.md (este arquivo)
- **Novo**: Documentação completa sobre configuração de ambientes
- **Conteúdo**: Passo a passo do fluxo Leap → Encore, troubleshooting, verificações

---

## ✅ Checklist Final

Antes de considerar o deployment completo, confirme:

### No Encore Dashboard:

- [ ] **Environment Variables** (build time) configuradas:
  - [ ] `VITE_CLERK_PUBLISHABLE_KEY_TEST` em Preview/Staging/Dev
  - [ ] `VITE_CLERK_PUBLISHABLE_KEY_LIVE` em Production
  - [ ] `VITE_CLERK_FRONTEND_API_TEST` em Preview/Staging/Dev
  - [ ] `VITE_CLERK_FRONTEND_API_LIVE` em Production
  - [ ] `VITE_CLIENT_TARGET=/` em todos ambientes deployados

- [ ] **Secrets** (runtime) configurados:
  - [ ] `ClerkSecretKey` com `sk_test_...` em Preview/Staging/Dev
  - [ ] `ClerkSecretKey` com `sk_live_...` em Production

### Após Deploy:

- [ ] Deploy/rebuild feito após configurar as variáveis
- [ ] Console do navegador mostra `hasError: false`
- [ ] Publishable key aparece no console (não `[NOT SET]`)
- [ ] Login do Clerk funcionando
- [ ] Backend validando tokens JWT corretamente

---

Com essas mudanças, você terá:
- ✅ Feedback visual claro sobre problemas de configuração
- ✅ Builds otimizados para cada ambiente
- ✅ Documentação completa para configurar novos ambientes
- ✅ Troubleshooting detalhado para problemas comuns
