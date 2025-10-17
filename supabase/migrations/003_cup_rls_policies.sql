-- Row Level Security (RLS) Policies for Cup Tournament Tables
-- Follows the same pattern as existing league RLS policies
-- Uses helper functions: auth.user_id(), is_admin(), current_user_uuid()

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

-- All authenticated users can view cups
CREATE POLICY "cups_select_policy" ON cups
    FOR SELECT
    USING (true);

-- Only league admins can create cups
CREATE POLICY "cups_insert_policy" ON cups
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN leagues l ON l.id = cups.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

-- Only league admins can update cups
CREATE POLICY "cups_update_policy" ON cups
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN leagues l ON l.id = cups.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

-- Only league admins can delete cups
CREATE POLICY "cups_delete_policy" ON cups
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN leagues l ON l.id = cups.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

-- ============================================================
-- CUP GROUPS TABLE POLICIES
-- ============================================================

-- All authenticated users can view cup groups
CREATE POLICY "cup_groups_select_policy" ON cup_groups
    FOR SELECT
    USING (true);

-- Only league admins can manage cup groups
CREATE POLICY "cup_groups_insert_policy" ON cup_groups
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cups c ON c.id = cup_groups.cup_id
            JOIN leagues l ON l.id = c.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

CREATE POLICY "cup_groups_update_policy" ON cup_groups
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cups c ON c.id = cup_groups.cup_id
            JOIN leagues l ON l.id = c.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

CREATE POLICY "cup_groups_delete_policy" ON cup_groups
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cups c ON c.id = cup_groups.cup_id
            JOIN leagues l ON l.id = c.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

-- ============================================================
-- CUP GAMEWEEKS TABLE POLICIES
-- ============================================================

-- All authenticated users can view cup gameweeks
CREATE POLICY "cup_gameweeks_select_policy" ON cup_gameweeks
    FOR SELECT
    USING (true);

-- Only league admins can manage cup gameweeks
CREATE POLICY "cup_gameweeks_insert_policy" ON cup_gameweeks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cups c ON c.id = cup_gameweeks.cup_id
            JOIN leagues l ON l.id = c.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

CREATE POLICY "cup_gameweeks_update_policy" ON cup_gameweeks
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cups c ON c.id = cup_gameweeks.cup_id
            JOIN leagues l ON l.id = c.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

CREATE POLICY "cup_gameweeks_delete_policy" ON cup_gameweeks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cups c ON c.id = cup_gameweeks.cup_id
            JOIN leagues l ON l.id = c.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

-- ============================================================
-- CUP MATCHES TABLE POLICIES
-- ============================================================

-- All authenticated users can view cup matches
CREATE POLICY "cup_matches_select_policy" ON cup_matches
    FOR SELECT
    USING (true);

-- Only league admins can create cup matches
CREATE POLICY "cup_matches_insert_policy" ON cup_matches
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cups c ON c.id = cup_matches.cup_id
            JOIN leagues l ON l.id = c.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

-- Only league admins can update cup matches (for scores)
CREATE POLICY "cup_matches_update_policy" ON cup_matches
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cups c ON c.id = cup_matches.cup_id
            JOIN leagues l ON l.id = c.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

-- Only league admins can delete cup matches
CREATE POLICY "cup_matches_delete_policy" ON cup_matches
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cups c ON c.id = cup_matches.cup_id
            JOIN leagues l ON l.id = c.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

-- ============================================================
-- CUP LINEUPS TABLE POLICIES
-- ============================================================

-- Users can view all cup lineups
CREATE POLICY "cup_lineups_select_policy" ON cup_lineups
    FOR SELECT
    USING (true);

-- Managers can insert their own lineups
CREATE POLICY "cup_lineups_insert_policy" ON cup_lineups
    FOR INSERT
    WITH CHECK (
        manager_id = current_user_uuid()
    );

-- Managers can update their own lineups (before lock date)
CREATE POLICY "cup_lineups_update_policy" ON cup_lineups
    FOR UPDATE
    USING (
        manager_id = current_user_uuid()
        AND EXISTS (
            SELECT 1 FROM cup_gameweeks cg
            JOIN gameweeks g ON g.id = cg.league_gameweek_id
            WHERE cg.id = cup_lineups.cup_gameweek_id
            AND NOW() <= g.lock_date
        )
    );

-- Managers can delete their own lineups (before lock date)
CREATE POLICY "cup_lineups_delete_policy" ON cup_lineups
    FOR DELETE
    USING (
        manager_id = current_user_uuid()
        AND EXISTS (
            SELECT 1 FROM cup_gameweeks cg
            JOIN gameweeks g ON g.id = cg.league_gameweek_id
            WHERE cg.id = cup_lineups.cup_gameweek_id
            AND NOW() <= g.lock_date
        )
    );

-- Admins can manage all cup lineups
CREATE POLICY "cup_lineups_admin_all_policy" ON cup_lineups
    FOR ALL
    USING (is_admin());

-- ============================================================
-- CUP GROUP STANDINGS TABLE POLICIES
-- ============================================================

-- All authenticated users can view cup group standings
CREATE POLICY "cup_group_standings_select_policy" ON cup_group_standings
    FOR SELECT
    USING (true);

-- Only league admins can manage cup group standings
CREATE POLICY "cup_group_standings_insert_policy" ON cup_group_standings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cups c ON c.id = cup_group_standings.cup_id
            JOIN leagues l ON l.id = c.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

CREATE POLICY "cup_group_standings_update_policy" ON cup_group_standings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cups c ON c.id = cup_group_standings.cup_id
            JOIN leagues l ON l.id = c.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

CREATE POLICY "cup_group_standings_delete_policy" ON cup_group_standings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN cups c ON c.id = cup_group_standings.cup_id
            JOIN leagues l ON l.id = c.league_id
            WHERE u.clerk_id = auth.user_id()::TEXT
            AND (u.is_admin = true OR l.admin_id = u.id)
        )
    );

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "cups_select_policy" ON cups IS 'All authenticated users can view cups';
COMMENT ON POLICY "cups_insert_policy" ON cups IS 'Only league admins can create cups';
COMMENT ON POLICY "cup_lineups_update_policy" ON cup_lineups IS 'Managers can update their lineups before gameweek lock date';
COMMENT ON POLICY "cup_lineups_admin_all_policy" ON cup_lineups IS 'Admins can bypass all restrictions on cup lineups';
