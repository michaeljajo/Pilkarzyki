/**
 * Run migration 021: Add country column to players
 *
 * Usage: npx tsx scripts/run-migration-021.ts
 */

import { supabaseAdmin } from '../src/lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  console.log('Running migration 021: Add country to players...\n')

  const migrationPath = path.join(__dirname, '../supabase/migrations/021_add_player_country.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  const { error } = await supabaseAdmin.rpc('exec_sql', { sql_string: sql })

  if (error) {
    console.error('❌ Migration failed via exec_sql:', error)
    console.error('\nRun the following SQL manually in the Supabase SQL editor:\n')
    console.error(sql)
    process.exit(1)
  }

  console.log('✅ Migration 021 applied successfully')
  process.exit(0)
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
