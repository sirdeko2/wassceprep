-- Migration 009: Add MTN MoMo columns to subscriptions table
-- Replaces Flutterwave fields with MTN-compatible ones

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_method   TEXT DEFAULT 'mtn_momo';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mtn_reference_id TEXT;
