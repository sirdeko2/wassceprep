-- ============================================================
-- WASSCEPrep — Migration 006: Payments & Subscription upgrades
-- ============================================================

-- ── 1. payments table — full transaction history ─────────────
-- Every Flutterwave transaction is recorded here.
-- This is your audit trail and the source of truth for billing.
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tx_ref              TEXT UNIQUE NOT NULL,          -- WASSCEPrep reference (WP-...)
  flw_transaction_id  TEXT,                          -- Flutterwave's transaction ID
  amount              NUMERIC(10,2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'USD',
  phone_number        TEXT,                          -- Mobile money number used
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','successful','failed','cancelled')),
  paid_at             TIMESTAMPTZ,                   -- When payment was confirmed
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_txref ON payments(tx_ref);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- Students can see their own payment history
CREATE POLICY "users_see_own_payments"
  ON payments FOR SELECT USING (auth.uid() = user_id);
-- Only server-side (service role) can insert/update payments
-- No INSERT/UPDATE policy for authenticated role — use service role key in functions


-- ── 2. Upgrade subscriptions table ───────────────────────────
-- Add flw_transaction_id if it doesn't exist (used for idempotency)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS flw_transaction_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mobile_number TEXT;

-- Ensure updated_at column exists
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── 3. Subscription RLS (ensure students can read their own) ──
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions' AND policyname = 'users_see_own_subscription'
  ) THEN
    EXECUTE 'CREATE POLICY "users_see_own_subscription"
      ON subscriptions FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END$$;
