# Configuração do Webhook do Clerk para Sincronização de Deleção de Usuários

Este documento explica como configurar o webhook do Clerk para sincronizar automaticamente a deleção de usuários com o banco de dados.

## 📋 Problema

Quando um usuário é deletado via dashboard do Clerk, a mudança não era refletida automaticamente no banco de dados da aplicação. Isso causava inconsistências entre o Clerk e o banco de dados local.

## ✅ Solução

Foi implementado um webhook endpoint que recebe eventos do Clerk e processa automaticamente a deleção de usuários.

## 🔧 Arquivos Modificados/Criados

1. **`backend/hub/webhook_clerk.ts`** - Novo endpoint de webhook
2. **`backend/package.json`** - Adicionada dependência `svix` para validação de assinaturas

## 📝 Passos de Configuração

### 1. Instalar Dependências

Execute no diretório `backend/`:

```bash
bun install
# ou
npm install
```

Isso instalará a dependência `svix` necessária para validar as assinaturas dos webhooks do Clerk.

### 2. Configurar o Webhook no Dashboard do Clerk

#### 2.1. Acessar o Dashboard do Clerk

1. Acesse [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Selecione seu projeto/aplicação
3. No menu lateral, clique em **"Webhooks"**

#### 2.2. Adicionar Endpoint de Webhook

1. Clique no botão **"Add Endpoint"**
2. Preencha os campos:

   **Endpoint URL:**
   ```
   https://seu-dominio.com/webhooks/clerk
   ```

   > ⚠️ **Importante**: Substitua `seu-dominio.com` pelo domínio real da sua aplicação.
   > - Desenvolvimento: pode ser um túnel ngrok ou similar
   > - Produção: use o domínio de produção (ex: `https://api.magik.tools/webhooks/clerk`)

3. **Selecione os eventos** (recomendado):
   - ✅ `user.deleted` (OBRIGATÓRIO)
   - ✅ `user.created` (opcional, para logs)
   - ✅ `user.updated` (opcional, para logs)

4. Clique em **"Create"**

#### 2.3. Copiar o Signing Secret

Após criar o webhook, você verá o **Signing Secret** (começa com `whsec_`).

**⚠️ IMPORTANTE**: Copie este secret imediatamente! Ele só é mostrado uma vez.

### 3. Configurar o Secret no Encore

O webhook usa o secret `ClerkWebhookSecret` para validar as assinaturas.

#### 3.1. Desenvolvimento

```bash
encore secret set --type dev ClerkWebhookSecret
# Cole o signing secret quando solicitado (whsec_...)
```

#### 3.2. Produção

```bash
encore secret set --type prod ClerkWebhookSecret
# Cole o signing secret quando solicitado (whsec_...)
```

### 4. Testar a Configuração

#### 4.1. Verificar Endpoint

Acesse o endpoint de debug para verificar que está configurado corretamente:

```bash
curl https://seu-dominio.com/webhooks/clerk/_debug
```

Resposta esperada:
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

#### 4.2. Testar no Clerk Dashboard

1. No Clerk Dashboard, vá para **Webhooks**
2. Clique no webhook que você criou
3. Na aba **"Testing"**, clique em **"Send Example"**
4. Selecione o evento `user.deleted`
5. Clique em **"Send"**

Você deve ver:
- ✅ Status 200 OK
- ✅ Response: `{"status":"ok"}`

#### 4.3. Testar Deleção Real (Opcional)

⚠️ **Use ambiente de desenvolvimento apenas!**

1. Crie um usuário de teste no Clerk
2. Vincule-o a uma membership de teste (faça claim)
3. Delete o usuário via Clerk Dashboard
4. Verifique no banco de dados:
   - A membership deve ter `user_id = NULL`
   - O status deve ser `canceled`
   - `deactivated_at` deve estar preenchido
   - Deve existir um registro em `admin_actions` com `action_type = 'user_deleted_webhook'`

## 🔍 Comportamento do Webhook

### Evento: `user.deleted`

Quando um usuário é deletado no Clerk Dashboard:

1. ✅ **Encontra a membership** vinculada ao `user_id`
2. ✅ **Desvincula o usuário**: Define `user_id = NULL`
3. ✅ **Atualiza o status**: Define `status = 'canceled'`
4. ✅ **Marca data de desativação**: Define `deactivated_at = NOW()`
5. ✅ **Registra auditoria**: Cria registro em `admin_actions`
6. ✅ **Promove próximo**: Se o usuário estava `active`, promove o próximo da waitlist

**IMPORTANTE**: A membership **NÃO é deletada** do banco de dados! Apenas é desvinculada do usuário do Clerk. Isso permite:
- ✅ Manter histórico completo de transações
- ✅ Permitir que o usuário reclame novamente se criar nova conta
- ✅ Auditoria completa de todas as ações

### Eventos Opcionais

- **`user.created`**: Apenas logado, nenhuma ação tomada
- **`user.updated`**: Apenas logado, nenhuma ação tomada

## 📊 Logs e Monitoramento

O webhook registra informações detalhadas nos logs do Encore:

```typescript
// Log de sucesso
log.info("Usuário desvinculado da membership", {
  userId: "user_xxx",
  membershipId: 123,
  email: "usuario@exemplo.com",
  previousStatus: "active",
  wasActive: true
});

// Log de erro
log.error("Erro ao processar user.deleted", {
  userId: "user_xxx",
  message: "...",
  stack: "..."
});
```

Para visualizar os logs:

```bash
# Logs de desenvolvimento
encore logs

# Logs de produção
encore logs --env prod
```

## 🔒 Segurança

### Validação de Assinatura

Todos os webhooks do Clerk são assinados usando **Svix**. O endpoint valida automaticamente:

1. ✅ Headers obrigatórios: `svix-id`, `svix-timestamp`, `svix-signature`
2. ✅ Assinatura HMAC do payload
3. ✅ Timestamp (previne replay attacks)

Se qualquer validação falhar, o webhook retorna **400 Bad Request**.

### Proteção contra Replay Attacks

O Svix automaticamente rejeita requisições com timestamps muito antigos (> 5 minutos), prevenindo ataques de replay.

### Secrets

- ✅ `ClerkWebhookSecret` armazenado via Encore (nunca no código)
- ✅ Secret diferente para dev e prod
- ✅ Rotação de secrets suportada pelo Clerk Dashboard

## 🚨 Troubleshooting

### Webhook retorna 400 "Missing Svix headers"

**Causa**: Headers de assinatura não estão sendo enviados.

**Solução**: Verifique que configurou o endpoint corretamente no Clerk Dashboard.

### Webhook retorna 400 "Invalid signature"

**Causa**: O `ClerkWebhookSecret` configurado está incorreto.

**Solução**:
1. Verifique o secret no Clerk Dashboard (aba Webhooks → seu endpoint → Signing Secret)
2. Reconfigure usando `encore secret set --type dev ClerkWebhookSecret`
3. Certifique-se de que não há espaços extras ao colar o secret

### Webhook retorna 200 mas não processa

**Causa**: Possível erro interno na lógica de processamento.

**Solução**:
1. Verifique os logs: `encore logs`
2. Procure por erros com `log.error`
3. Verifique se a membership existe no banco de dados

### Usuário deletado mas próximo da waitlist não foi promovido

**Causa**: Usuário não estava com status `active` ou não havia ninguém na waitlist.

**Solução**: Isso é comportamento esperado. Apenas usuários `active` liberam vaga para promoção.

## 📚 Referências

- [Clerk Webhooks Documentation](https://clerk.com/docs/integrations/webhooks)
- [Svix Documentation](https://docs.svix.com/)
- [Encore Secrets Management](https://encore.dev/docs/primitives/secrets)

## 🔄 Próximos Passos

Após configurar o webhook:

1. ✅ Teste em ambiente de desenvolvimento
2. ✅ Configure em produção
3. ✅ Configure alertas/monitoramento para falhas de webhook
4. ✅ Documente o processo para a equipe
5. ✅ Configure backup/retry policy se necessário (Clerk já faz retry automático)

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `encore logs`
2. Teste o endpoint de debug: `/webhooks/clerk/_debug`
3. Verifique a configuração no Clerk Dashboard
4. Revise este documento

---

**Data de Criação**: 2025-11-05
**Versão**: 1.0
**Autor**: Claude Code (Anthropic)
