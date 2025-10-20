-- Add field to track admin-created lineups
ALTER TABLE lineups
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_creator_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN lineups.created_by_admin IS 'Indicates if this lineup was created by an admin on behalf of a manager';
COMMENT ON COLUMN lineups.admin_creator_id IS 'The admin user who created this lineup (if created_by_admin is true)';
