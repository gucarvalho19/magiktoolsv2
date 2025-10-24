-- Add claim code system to memberships
ALTER TABLE memberships ADD COLUMN claim_code TEXT UNIQUE;
ALTER TABLE memberships ADD COLUMN claim_code_used_at TIMESTAMPTZ;
ALTER TABLE memberships ADD COLUMN customer_cpf TEXT;

-- Indexes for claim code lookups
CREATE INDEX idx_memberships_claim_code ON memberships(claim_code) WHERE claim_code IS NOT NULL;
CREATE INDEX idx_memberships_customer_cpf ON memberships(customer_cpf) WHERE customer_cpf IS NOT NULL;

-- Admin actions audit table
CREATE TABLE admin_actions (
  id BIGSERIAL PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_membership_id BIGINT REFERENCES memberships(id),
  target_user_id TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for admin actions
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_user_id);
CREATE INDEX idx_admin_actions_membership ON admin_actions(target_membership_id);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type);
