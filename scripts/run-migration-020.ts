/**
 * Run migration 020: Add configurable max_managers to leagues
 *
 * Usage: npx tsx scripts/run-migration-020.ts
 */

import { supabaseAdmin } from '../src/lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  console.log('Running migration 020: Add max_managers to leagues...\n')

  const migrationPath = path.join(__dirname, '../supabase/migrations/020_add_max_managers.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  // Execute the whole file in one call. exec_sql runs it as a single SQL
  // script, which safely handles statements without needing to split on ';'.
  const { error } = await supabaseAdmin.rpc('exec_sql', { sql_string: sql })

  if (error) {
    console.error('❌ Migration failed via exec_sql:', error)
    console.error('\nRun the following SQL manually in the Supabase SQL editor:\n')
    console.error(sql)
    process.exit(1)
  }

  console.log('✅ Migration 020 applied successfully')
  process.exit(0)
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
