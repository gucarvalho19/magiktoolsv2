CREATE TYPE membership_status AS ENUM ('active', 'waitlisted', 'pending', 'past_due', 'canceled', 'refunded');

CREATE TABLE memberships (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  user_id TEXT,
  kiwify_order_id TEXT UNIQUE NOT NULL,
  status membership_status NOT NULL DEFAULT 'pending',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_email ON memberships(email);
CREATE INDEX idx_memberships_user_id ON memberships(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_memberships_kiwify_order_id ON memberships(kiwify_order_id);
CREATE INDEX idx_memberships_purchased_at ON memberships(purchased_at);
