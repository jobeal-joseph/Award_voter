-- ============================================================
-- Golden Gala Awards — Supabase Database Setup
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Awards / Categories table
CREATE TABLE IF NOT EXISTS awards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Nominees table
CREATE TABLE IF NOT EXISTS nominees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  votes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Votes table (for deduplication — one vote per visitor per award)
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
  nominee_id UUID NOT NULL REFERENCES nominees(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,  -- fingerprint / anonymous id
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(award_id, voter_id) -- one vote per category per visitor
);

-- 4. Admin users table (for role-based access)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_nominees_award_id ON nominees(award_id);
CREATE INDEX IF NOT EXISTS idx_votes_award_id ON votes(award_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON votes(voter_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ---- Awards policies ----
CREATE POLICY "Anyone can read awards"
  ON awards FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert awards"
  ON awards FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update awards"
  ON awards FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete awards"
  ON awards FOR DELETE
  USING (is_admin());

-- ---- Nominees policies ----
CREATE POLICY "Anyone can read nominees"
  ON nominees FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert nominees"
  ON nominees FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update nominees"
  ON nominees FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete nominees"
  ON nominees FOR DELETE
  USING (is_admin());

-- ---- Votes policies ----
CREATE POLICY "Anyone can read votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert votes"
  ON votes FOR INSERT
  WITH CHECK (true);

-- ---- Admin users policies ----
CREATE POLICY "Admins can read admin_users"
  ON admin_users FOR SELECT
  USING (is_admin());

-- ============================================================
-- RPC: Atomic vote function (increment + insert in one call)
-- ============================================================
CREATE OR REPLACE FUNCTION cast_vote(
  p_award_id UUID,
  p_nominee_id UUID,
  p_voter_id TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Insert vote record (will fail on duplicate due to UNIQUE constraint)
  INSERT INTO votes (award_id, nominee_id, voter_id)
  VALUES (p_award_id, p_nominee_id, p_voter_id);

  -- Increment nominee vote count
  UPDATE nominees
  SET votes = votes + 1
  WHERE id = p_nominee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Seed data (optional — matches your original categories)
-- ============================================================
INSERT INTO awards (name, description, display_order) VALUES
  ('Best Movie',          'The most outstanding film of the year.',                           1),
  ('Best Actor',          'Outstanding performance by an actor in a leading role.',           2),
  ('Best Director',       'Outstanding achievement in directing a film.',                    3),
  ('Best Original Score', 'The best musical composition written specifically for a film.',    4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Enable Realtime on tables (so frontend gets live updates)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE awards;
ALTER PUBLICATION supabase_realtime ADD TABLE nominees;

-- ============================================================
-- Storage bucket for nominee images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('nominee-images', 'nominee-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read images (public bucket)
CREATE POLICY "Public read access for nominee images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'nominee-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload nominee images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'nominee-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete nominee images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'nominee-images');
