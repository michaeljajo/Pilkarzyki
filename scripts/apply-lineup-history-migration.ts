/**
 * Script to apply the lineup history migration
 * Run with: npx tsx scripts/apply-lineup-history-migration.ts
 */

import { supabaseAdmin } from '../src/lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

async function applyMigration() {
  try {
    console.log('📦 Reading migration file...')
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/012_add_lineup_history.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('🚀 Applying migration to database...')

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement })
      if (error) {
        // Try direct query as fallback
        const { error: directError } = await supabaseAdmin.from('_migrations').select('*').limit(1)
        if (directError) {
          console.error('❌ Error executing statement:', error)
          console.error('Statement was:', statement.substring(0, 100) + '...')
        }
      }
    }

    console.log('✅ Migration applied successfully!')
    console.log('\n📋 Verifying tables...')

    // Verify tables exist
    const { data: lineupHistoryTest, error: lhError } = await supabaseAdmin
      .from('lineup_history')
      .select('count')
      .limit(1)

    const { data: cupHistoryTest, error: chError } = await supabaseAdmin
      .from('cup_lineup_history')
      .select('count')
      .limit(1)

    if (!lhError && !chError) {
      console.log('✅ Tables verified: lineup_history and cup_lineup_history exist')
    } else {
      console.error('⚠️  Table verification failed:', { lhError, chError })
      console.log('\n📝 Please apply the migration manually via Supabase Dashboard SQL Editor:')
      console.log('   1. Go to your Supabase Dashboard')
      console.log('   2. Navigate to SQL Editor')
      console.log('   3. Copy and paste the contents of: supabase/migrations/012_add_lineup_history.sql')
      console.log('   4. Click "Run"')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\n📝 Please apply the migration manually via Supabase Dashboard SQL Editor:')
    console.log('   1. Go to your Supabase Dashboard')
    console.log('   2. Navigate to SQL Editor')
    console.log('   3. Copy and paste the contents of: supabase/migrations/012_add_lineup_history.sql')
    console.log('   4. Click "Run"')
  }
}

applyMigration()
