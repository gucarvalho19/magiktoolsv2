# ⚡ Solução Rápida: Variáveis de Ambiente no Leap

## TL;DR

Crie `/frontend/.env` com suas chaves do Clerk. O Vite carrega automaticamente, mesmo se o Leap regenerar o `vite.config.ts`.

## Passo a Passo

```bash
# 1. Vá para a pasta frontend
cd /frontend

# 2. Copie o template
cp .env.example .env

# 3. Edite com suas chaves
nano .env  # ou use qualquer editor
```

## Conteúdo do .env

```env
VITE_CLERK_PUBLISHABLE_KEY_TEST=pk_test_...
VITE_CLERK_PUBLISHABLE_KEY_LIVE=pk_live_...
VITE_CLIENT_TARGET=/
```

## Por Que Funciona?

1. **Vite carrega `.env` nativamente** - não precisa de config customizada
2. **Variáveis com `VITE_` são expostas** automaticamente para o frontend
3. **Mesmo se o Leap regenerar o `vite.config.ts`**, o `.env` continua funcionando

## Verificação

Abra o console do navegador e procure por:

```
🔧 Config loaded: { publishableKeyPrefix: 'pk_test_...' }
```

Se aparecer `[NOT SET]`, o `.env` não foi carregado corretamente.

## Documentação Completa

Veja `/frontend/ENV_SETUP.md` para detalhes completos.

#Test
