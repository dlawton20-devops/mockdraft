-- ============================================
-- Supabase SQL Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mock drafts table
CREATE TABLE IF NOT EXISTS mock_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  mode TEXT CHECK (mode IN ('manual', 'auto', 'predict')),
  team_abbr TEXT,
  overall_grade TEXT,
  results JSONB,
  trade_log JSONB
);

-- Favorite teams
CREATE TABLE IF NOT EXISTS favorite_teams (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_abbr TEXT NOT NULL,
  PRIMARY KEY (user_id, team_abbr)
);

-- Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own drafts"
  ON mock_drafts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drafts"
  ON mock_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts"
  ON mock_drafts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
  ON favorite_teams FOR ALL USING (auth.uid() = user_id);

-- Service role bypasses RLS for webhook updates
-- (Supabase service key is used server-side only)

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mock_drafts_user ON mock_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_drafts_created ON mock_drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
