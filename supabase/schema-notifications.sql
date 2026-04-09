-- ─────────────────────────────────────────────────────────────────────────────
-- D3: Smart Notifications table
-- Run this in the Supabase SQL editor (or migration runner)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL
                CHECK (type IN ('streak_at_risk', 'vocab_review_due', 'writing_reminder', 'achievement_unlocked')),
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS notifications_user_created
  ON notifications (user_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
