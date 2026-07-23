/**
 * Run migration 023: Drop players.country
 *
 * Usage: npx tsx scripts/run-migration-023.ts
 */

import { supabaseAdmin } from '../src/lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  console.log('Running migration 023: Drop players.country...\n')

  const migrationPath = path.join(__dirname, '../supabase/migrations/023_drop_player_country.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  const { error } = await supabaseAdmin.rpc('exec_sql', { sql_string: sql })

  if (error) {
    console.error('❌ Migration failed via exec_sql:', error.message)
    console.error('\nRun the following SQL manually in the Supabase SQL editor:\n')
    console.error(sql)
    process.exit(1)
  }

  console.log('✅ Migration 023 applied successfully')
  process.exit(0)
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
