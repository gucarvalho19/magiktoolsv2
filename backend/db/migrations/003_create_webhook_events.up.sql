-- Tabela para rastrear eventos de webhook já processados (idempotência)
CREATE TABLE webhook_events (
  id BIGSERIAL PRIMARY KEY,
  webhook_id TEXT UNIQUE NOT NULL,     -- svix-id do evento
  event_type TEXT NOT NULL,             -- Tipo do evento (ex: user.deleted)
  payload JSONB NOT NULL,               -- Payload completo do evento
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed_at ON webhook_events(processed_at);

-- Comentários para documentação
COMMENT ON TABLE webhook_events IS 'Rastreia eventos de webhook já processados para garantir idempotência';
COMMENT ON COLUMN webhook_events.webhook_id IS 'ID único do webhook (svix-id) usado para prevenir processamento duplicado';
COMMENT ON COLUMN webhook_events.event_type IS 'Tipo do evento webhook (ex: user.deleted, user.created)';
COMMENT ON COLUMN webhook_events.payload IS 'Payload completo do evento para auditoria e debug';
