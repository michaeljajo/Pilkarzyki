-- Row Level Security (RLS) Policies for Cup Tournament Tables
-- Simplified version using direct Supabase auth functions

-- Enable RLS on all cup tables
ALTER TABLE cups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cup_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cup_gameweeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cup_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE cup_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cup_group_standings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CUPS TABLE POLICIES
-- ============================================================

-- All users can view cups
CREATE POLICY "cups_select_policy" ON cups
    FOR SELECT
    USING (true);

-- Admins can manage all cups
CREATE POLICY "cups_admin_all_policy" ON cups
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')::TEXT
            AND is_admin = true
        )
    );

-- ============================================================
-- CUP GROUPS TABLE POLICIES
-- ============================================================

-- All users can view cup groups
CREATE POLICY "cup_groups_select_policy" ON cup_groups
    FOR SELECT
    USING (true);

-- Admins can manage cup groups
CREATE POLICY "cup_groups_admin_all_policy" ON cup_groups
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')::TEXT
            AND is_admin = true
        )
    );

-- ============================================================
-- CUP GAMEWEEKS TABLE POLICIES
-- ============================================================

-- All users can view cup gameweeks
CREATE POLICY "cup_gameweeks_select_policy" ON cup_gameweeks
    FOR SELECT
    USING (true);

-- Admins can manage cup gameweeks
CREATE POLICY "cup_gameweeks_admin_all_policy" ON cup_gameweeks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')::TEXT
            AND is_admin = true
        )
    );

-- ============================================================
-- CUP MATCHES TABLE POLICIES
-- ============================================================

-- All users can view cup matches
CREATE POLICY "cup_matches_select_policy" ON cup_matches
    FOR SELECT
    USING (true);

-- Admins can manage cup matches
CREATE POLICY "cup_matches_admin_all_policy" ON cup_matches
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')::TEXT
            AND is_admin = true
        )
    );

-- ============================================================
-- CUP LINEUPS TABLE POLICIES
-- ============================================================

-- All users can view cup lineups
CREATE POLICY "cup_lineups_select_policy" ON cup_lineups
    FOR SELECT
    USING (true);

-- Managers can insert their own lineups
CREATE POLICY "cup_lineups_insert_policy" ON cup_lineups
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')::TEXT
            AND id = cup_lineups.manager_id
        )
    );

-- Managers can update their own lineups (before lock date)
CREATE POLICY "cup_lineups_update_policy" ON cup_lineups
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cup_gameweeks cg ON cg.id = cup_lineups.cup_gameweek_id
            JOIN gameweeks g ON g.id = cg.league_gameweek_id
            WHERE u.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')::TEXT
            AND u.id = cup_lineups.manager_id
            AND NOW() <= g.lock_date
        )
    );

-- Managers can delete their own lineups (before lock date)
CREATE POLICY "cup_lineups_delete_policy" ON cup_lineups
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cup_gameweeks cg ON cg.id = cup_lineups.cup_gameweek_id
            JOIN gameweeks g ON g.id = cg.league_gameweek_id
            WHERE u.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')::TEXT
            AND u.id = cup_lineups.manager_id
            AND NOW() <= g.lock_date
        )
    );

-- Admins can manage all cup lineups
CREATE POLICY "cup_lineups_admin_all_policy" ON cup_lineups
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')::TEXT
            AND is_admin = true
        )
    );

-- ============================================================
-- CUP GROUP STANDINGS TABLE POLICIES
-- ============================================================

-- All users can view cup group standings
CREATE POLICY "cup_group_standings_select_policy" ON cup_group_standings
    FOR SELECT
    USING (true);

-- Admins can manage cup group standings
CREATE POLICY "cup_group_standings_admin_all_policy" ON cup_group_standings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')::TEXT
            AND is_admin = true
        )
    );
