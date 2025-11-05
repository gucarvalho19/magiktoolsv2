# 🚀 Passos para Deploy do Webhook do Clerk

## ❌ Problema Identificado

O endpoint `/webhooks/clerk` estava retornando **404 Not Found** porque a dependência `svix` não estava instalada no ambiente de produção/staging.

Quando o código tenta fazer `import { Webhook } from "svix"`, isso falha e o arquivo inteiro não é carregado, impedindo que o endpoint seja registrado.

## ✅ Solução

As dependências já foram instaladas localmente. Agora você precisa:

1. ✅ **Instalar dependências** (já feito)
2. ⚠️ **Executar migrations**
3. ⚠️ **Fazer redeploy da aplicação**

---

## 📝 Passos de Deploy

### 1. Executar Migrations (Criar tabela webhook_events)

A migration `003_create_webhook_events` precisa ser executada para criar a tabela de idempotência.

**Desenvolvimento:**
```bash
# Se estiver usando Encore CLI localmente
encore db migrate

# Ou se estiver usando ferramenta de migration manual
# Execute o arquivo: backend/db/migrations/003_create_webhook_events.up.sql
```

**Produção:**
```bash
# Via Encore Cloud
encore db migrate --env prod

# Ou via ferramenta de migration que você usa
```

**SQL da Migration:**
```sql
CREATE TABLE webhook_events (
  id BIGSERIAL PRIMARY KEY,
  webhook_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed_at ON webhook_events(processed_at);
```

### 2. Fazer Deploy da Aplicação

**Opção A: Deploy via Encore Cloud**
```bash
# Se estiver usando Encore Cloud
git push  # Isso deve triggar deploy automático

# Ou explicitamente
encore deploy --env prod
```

**Opção B: Deploy Manual**
```bash
# 1. Build da aplicação
npm install
npm run build  # ou encore build

# 2. Reiniciar servidor/container
# (depende da sua infraestrutura)
```

**Opção C: Se estiver usando Docker/Container**
```bash
# Rebuild e restart do container
docker-compose down
docker-compose build
docker-compose up -d
```

### 3. Configurar Secret do Webhook (se ainda não fez)

```bash
# Desenvolvimento
encore secret set --type dev ClerkWebhookSecret
# Cole o Signing Secret do Clerk Dashboard (whsec_...)

# Produção
encore secret set --type prod ClerkWebhookSecret
# Cole o Signing Secret do Clerk Dashboard (whsec_...)
```

### 4. Verificar que o Endpoint Está Ativo

**Teste o endpoint de debug:**
```bash
curl https://seu-dominio.com/webhooks/clerk/_debug
```

**Resposta esperada:**
```json
{
  "ok": true,
  "route": "/webhooks/clerk",
  "method": "POST",
  "requiredHeaders": ["svix-id", "svix-timestamp", "svix-signature"],
  "supportedEvents": ["user.deleted", "user.created", "user.updated"],
  "message": "Webhook endpoint is configured correctly"
}
```

**Se ainda retornar 404:**
- Verifique os logs de deploy/build para erros
- Confirme que `svix` está instalado: `npm list svix`
- Verifique se o servidor foi reiniciado após o deploy

### 5. Testar o Webhook no Clerk Dashboard

1. Acesse [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Vá em **Webhooks** → seu endpoint
3. Na aba **"Testing"**, clique em **"Send Example"**
4. Selecione evento `user.deleted`
5. Clique em **"Send"**

**Resposta esperada:**
- Status: **200 OK**
- Response: `{"status":"ok"}`

### 6. Testar Deleção Real (Opcional)

⚠️ Use apenas em ambiente de desenvolvimento/staging!

1. Crie um usuário de teste no Clerk
2. Delete o usuário via Clerk Dashboard
3. Verifique os logs:
   ```bash
   encore logs --env dev | grep "webhook"
   ```
4. Verifique o banco de dados:
   ```sql
   -- Deve ter registro do evento
   SELECT * FROM webhook_events WHERE event_type = 'user.deleted' ORDER BY processed_at DESC LIMIT 1;

   -- Membership deve ter sido desvinculada
   SELECT user_id, status, deactivated_at FROM memberships WHERE user_id IS NULL ORDER BY updated_at DESC LIMIT 1;
   ```

---

## 🔍 Troubleshooting

### Ainda retorna 404 após deploy

**Causa**: Código não foi recarregado ou há erro de build.

**Solução**:
1. Verifique logs de build/deploy
2. Procure por erros de import ou TypeScript
3. Confirme que `backend/hub/webhook_clerk.ts` existe no deploy
4. Verifique se o service "hub" está ativo

### Erro "Table webhook_events does not exist"

**Causa**: Migration não foi executada.

**Solução**: Execute a migration conforme passo 1.

### Webhook retorna 500 ao receber evento

**Causa 1**: Secret não configurado.

**Solução**: Configure `ClerkWebhookSecret` conforme passo 3.

**Causa 2**: Tabela webhook_events não existe.

**Solução**: Execute a migration conforme passo 1.

---

## 📋 Checklist Rápido

- [ ] Dependências instaladas (`npm list svix` mostra svix@1.81.0)
- [ ] Migration executada (tabela `webhook_events` existe)
- [ ] Deploy/redeploy realizado
- [ ] Secret `ClerkWebhookSecret` configurado
- [ ] Endpoint debug responde 200 OK
- [ ] Teste no Clerk Dashboard retorna 200 OK

---

## 📞 Próximos Passos

Após completar o deploy:

1. ✅ Teste deletando um usuário de teste
2. ✅ Verifique que a membership foi desvinculada
3. ✅ Verifique que o evento foi registrado em `webhook_events`
4. ✅ Se tudo funcionar, atualize a URL do webhook no Clerk para produção

---

**Data**: 2025-11-05
**Motivo do 404**: Dependência `svix` não estava instalada no ambiente de produção
