# Guia de Configuração de Deployment

Este documento descreve como configurar as variáveis de ambiente necessárias para cada ambiente de deployment.

## ⚠️ Problema Identificado

Os ambientes de preview, staging e produção estão apresentando tela em branco porque **as variáveis de ambiente do Clerk não estão configuradas**.

## 📋 Variáveis de Ambiente Necessárias

### Para Desenvolvimento/Staging/Preview (não-produção)

Configure estas variáveis em ambientes de teste:

```bash
VITE_CLERK_PUBLISHABLE_KEY_TEST=pk_test_... # Sua chave pública de teste do Clerk
VITE_CLERK_FRONTEND_API_TEST=xxxxx.clerk.accounts.dev # Seu domínio de teste
VITE_CLIENT_TARGET=/ # Para Encore (backend servido na mesma origem)
```

### Para Produção (app.magik.tools)

Configure estas variáveis apenas para produção:

```bash
VITE_CLERK_PUBLISHABLE_KEY_LIVE=pk_live_... # Sua chave pública de produção
VITE_CLERK_FRONTEND_API_LIVE=clerk.magik.tools # Domínio customizado do Clerk
VITE_CLIENT_TARGET=/ # Para Encore
```

## 🚀 Configuração por Plataforma

### Leap (Preview - *.lp.dev)

1. Acesse o painel do Leap
2. Vá em **Settings → Environment Variables**
3. Adicione as variáveis de **teste**:
   - `VITE_CLERK_PUBLISHABLE_KEY_TEST`
   - `VITE_CLERK_FRONTEND_API_TEST`
   - `VITE_CLIENT_TARGET=/`
4. Faça um novo deployment

**URL afetada**: https://saas-hub-dashboard-d35d1c482vjgjdhh8ov0.lp.dev

### Encore (Staging - *.encr.app)

1. Acesse o painel do Encore
2. Vá em **Settings → Environment Variables** para o ambiente de staging
3. Adicione as variáveis de **teste**:
   - `VITE_CLERK_PUBLISHABLE_KEY_TEST`
   - `VITE_CLERK_FRONTEND_API_TEST`
   - `VITE_CLIENT_TARGET=/`
4. Faça um novo deployment

**URL afetada**: https://staging-saas-hub-dashboard-e8c2.frontend.encr.app

### Produção (app.magik.tools)

1. Acesse o painel da plataforma de produção
2. Vá em **Settings → Environment Variables** para o ambiente de produção
3. Adicione as variáveis de **produção**:
   - `VITE_CLERK_PUBLISHABLE_KEY_LIVE`
   - `VITE_CLERK_FRONTEND_API_LIVE`
   - `VITE_CLIENT_TARGET=/`
4. Faça um novo deployment

**URL afetada**: https://app.magik.tools

## 🔑 Obtendo as Chaves do Clerk

### Chaves de Teste (Development/Staging)

1. Acesse https://dashboard.clerk.com
2. Selecione sua aplicação
3. Vá em **Configure → API Keys**
4. Copie as chaves que começam com `pk_test_...`
5. Anote também o **Frontend API** que termina em `.clerk.accounts.dev`

### Chaves de Produção (Live)

1. No mesmo painel, mude para o ambiente **Production** (toggle no topo)
2. Copie as chaves que começam com `pk_live_...`
3. Anote o **Frontend API** customizado (se configurado como `clerk.magik.tools`)

## 🔒 Secrets do Backend (Encore)

Além das variáveis do frontend, configure o secret do backend:

```bash
# Para desenvolvimento/staging
encore secret set --type dev ClerkSecretKey

# Para produção
encore secret set --type prod ClerkSecretKey
```

Use as chaves secretas:
- **Dev/Staging**: `sk_test_...`
- **Produção**: `sk_live_...`

## ✅ Verificação Pós-Deploy

Após configurar e fazer deploy, verifique:

1. **Console do navegador** deve mostrar:
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

2. **Se houver erro**, você verá uma tela vermelha com instruções ao invés de tela em branco

3. **Login deve funcionar** - você será redirecionado para a tela de login do Clerk

## 🐛 Troubleshooting

### Ainda vejo tela em branco após configurar

1. Verifique o console do navegador (F12) para mensagens de erro
2. Confirme que as variáveis estão com os nomes exatos (case-sensitive)
3. Limpe o cache do navegador
4. Force um novo build/deployment

### Erro "Worker threw exception" no Cloudflare

Isso indica que o build teve algum problema. Verifique:
1. Se todas as variáveis estão configuradas
2. Se o build terminou com sucesso
3. Os logs de deployment na plataforma

### Detecção de ambiente incorreta

Se o ambiente estiver sendo detectado errado:
1. Verifique se o hostname está correto em `config.ts:3`
2. Para produção, deve ser exatamente `app.magik.tools`
3. Para outros ambientes, qualquer hostname diferente usa as chaves de teste

## 📝 Alterações Implementadas

As seguintes correções foram feitas no código:

1. **vite.config.ts** - Agora usa modo correto (dev/prod) e minifica em produção
2. **config.ts** - Melhor tratamento de erros sem quebrar a aplicação
3. **App.tsx** - Tela de erro amigável ao invés de tela em branco

Com essas mudanças, você terá feedback visual claro se houver problemas de configuração.
