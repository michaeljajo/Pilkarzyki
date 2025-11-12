-- Posts table for Tablica (message board) feature
CREATE TABLE posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_posts_league_id ON posts(league_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_league_created ON posts(league_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts table

-- Policy: Users can read posts from leagues they are members of (have a squad) or are admin of
CREATE POLICY "Users can read posts from their leagues"
ON posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM squads
    WHERE squads.league_id = posts.league_id
    AND squads.manager_id = auth.uid()::uuid
  )
  OR
  EXISTS (
    SELECT 1 FROM leagues
    WHERE leagues.id = posts.league_id
    AND leagues.admin_id = auth.uid()::uuid
  )
);

-- Policy: Users can create posts in leagues they are members of or are admin of
CREATE POLICY "Users can create posts in their leagues"
ON posts FOR INSERT
WITH CHECK (
  user_id = auth.uid()::uuid
  AND (
    EXISTS (
      SELECT 1 FROM squads
      WHERE squads.league_id = posts.league_id
      AND squads.manager_id = auth.uid()::uuid
    )
    OR
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = posts.league_id
      AND leagues.admin_id = auth.uid()::uuid
    )
  )
);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE
USING (user_id = auth.uid()::uuid);

-- Policy: League admins can delete any posts in their league
CREATE POLICY "League admins can delete posts in their league"
ON posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM leagues
    WHERE leagues.id = posts.league_id
    AND leagues.admin_id = auth.uid()::uuid
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
