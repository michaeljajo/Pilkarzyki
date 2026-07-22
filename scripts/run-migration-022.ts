/**
 * Run migration 022: Live draft (tables, functions, RLS, realtime)
 *
 * This migration contains Postgres functions whose bodies contain semicolons,
 * so it must NOT be split on ';'. We send the whole file as one script.
 *
 * If your database does not expose an `exec_sql` RPC that can run a multi-
 * statement script, run the SQL manually in the Supabase SQL editor — see
 * MIGRATION_022_INSTRUCTIONS.md.
 *
 * Usage: npx tsx scripts/run-migration-022.ts
 */

import { supabaseAdmin } from '../src/lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  console.log('Running migration 022: Live draft...\n')

  const migrationPath = path.join(__dirname, '../supabase/migrations/022_add_draft.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  const { error } = await supabaseAdmin.rpc('exec_sql', { sql_string: sql })

  if (error) {
    console.error('❌ Could not apply migration 022 via exec_sql:', error.message)
    console.error('\n➡️  Run supabase/migrations/022_add_draft.sql manually in the')
    console.error('    Supabase SQL editor. See MIGRATION_022_INSTRUCTIONS.md.\n')
    process.exit(1)
  }

  // Verify the drafts table exists.
  const { error: verifyError } = await supabaseAdmin.from('drafts').select('id', { head: true, count: 'exact' })
  if (verifyError) {
    console.error('⚠️  Applied, but could not verify the drafts table:', verifyError.message)
    process.exit(1)
  }

  console.log('✅ Migration 022 applied and verified (drafts table present)')
  process.exit(0)
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
