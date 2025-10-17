-- Row Level Security (RLS) Policies for Fantasy Football
-- Integrates with Clerk authentication via JWT tokens

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE gameweeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user from JWT
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::UUID
$$ LANGUAGE SQL STABLE;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM users
    WHERE clerk_id = auth.user_id()::TEXT
    AND is_admin = TRUE
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function to get current user's UUID from clerk_id
CREATE OR REPLACE FUNCTION current_user_uuid() RETURNS UUID AS $$
  SELECT id FROM users WHERE clerk_id = auth.user_id()::TEXT;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- USERS TABLE POLICIES
CREATE POLICY "Users can read all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own record" ON users
  FOR INSERT WITH CHECK (clerk_id = auth.user_id()::TEXT);

CREATE POLICY "Users can update their own record" ON users
  FOR UPDATE USING (clerk_id = auth.user_id()::TEXT);

CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE USING (is_admin());

-- LEAGUES TABLE POLICIES
CREATE POLICY "Anyone can read active leagues" ON leagues
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all leagues" ON leagues
  FOR ALL USING (is_admin());

-- PLAYERS TABLE POLICIES
CREATE POLICY "Anyone can read players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage all players" ON players
  FOR ALL USING (is_admin());

-- SQUADS TABLE POLICIES
CREATE POLICY "Users can read squads" ON squads
  FOR SELECT USING (true);

CREATE POLICY "Managers can read their own squad" ON squads
  FOR SELECT USING (manager_id = current_user_uuid());

CREATE POLICY "Admins can manage all squads" ON squads
  FOR ALL USING (is_admin());

-- SQUAD_PLAYERS TABLE POLICIES
CREATE POLICY "Users can read squad players" ON squad_players
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage squad players" ON squad_players
  FOR ALL USING (is_admin());

-- GAMEWEEKS TABLE POLICIES
CREATE POLICY "Anyone can read gameweeks" ON gameweeks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage gameweeks" ON gameweeks
  FOR ALL USING (is_admin());

-- LINEUPS TABLE POLICIES
CREATE POLICY "Users can read all lineups" ON lineups
  FOR SELECT USING (true);

CREATE POLICY "Managers can manage their own lineups" ON lineups
  FOR ALL USING (manager_id = current_user_uuid());

CREATE POLICY "Admins can manage all lineups" ON lineups
  FOR ALL USING (is_admin());

-- MATCHES TABLE POLICIES
CREATE POLICY "Anyone can read matches" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage matches" ON matches
  FOR ALL USING (is_admin());

-- RESULTS TABLE POLICIES
CREATE POLICY "Anyone can read results" ON results
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage results" ON results
  FOR ALL USING (is_admin());

-- STANDINGS TABLE POLICIES
CREATE POLICY "Anyone can read standings" ON standings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage standings" ON standings
  FOR ALL USING (is_admin());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;