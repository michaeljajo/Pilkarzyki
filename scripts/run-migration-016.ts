/**
 * Run Migration 016: League Data Isolation Safeguards
 * Adds database triggers to prevent cross-league data mixing
 */

import { supabaseAdmin } from '../src/lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  console.log('🔧 Running Migration 016: League Data Isolation Safeguards\n')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '016_add_league_safeguards.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('Executing migration SQL...')

    // Execute the migration using rpc to run raw SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // If exec_sql doesn't exist, try executing the SQL directly in parts
      console.log('Using alternative execution method...\n')

      // Split the migration into individual statements
      const statements = migrationSQL
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'))

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (!statement) continue

        console.log(`Executing statement ${i + 1}/${statements.length}...`)

        const { error: stmtError } = await supabaseAdmin.rpc('exec_sql', {
          sql: statement + ';'
        })

        if (stmtError) {
          console.error(`❌ Error in statement ${i + 1}:`, stmtError.message)
          throw stmtError
        }
      }
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\nSafeguards added:')
    console.log('  ✓ Transfer-player league validation trigger')
    console.log('  ✓ Squad-player league validation trigger')
    console.log('  ✓ Lineup-player league validation trigger')
    console.log('  ✓ Cross-league data issues monitoring view')

    // Verify the triggers exist
    console.log('\n🔍 Verifying triggers...')

    const { data: triggers, error: triggerError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT trigger_name, event_object_table
          FROM information_schema.triggers
          WHERE trigger_name LIKE 'trigger_validate_%_league'
          ORDER BY trigger_name;
        `
      })

    if (!triggerError && triggers) {
      console.log('Triggers found:', triggers)
    }

    // Check for existing cross-league issues
    console.log('\n🔍 Checking for existing cross-league data issues...')

    const { data: issues, error: issuesError } = await supabaseAdmin
      .from('cross_league_data_issues')
      .select('*')

    if (issuesError) {
      console.log('⚠️  Could not query cross_league_data_issues view:', issuesError.message)
    } else if (issues && issues.length > 0) {
      console.log(`\n❌ Found ${issues.length} cross-league data issues:`)
      issues.slice(0, 5).forEach(issue => {
        console.log(`  - ${issue.issue_type}: ${issue.player_name} - ${issue.description}`)
      })
      if (issues.length > 5) {
        console.log(`  ... and ${issues.length - 5} more`)
      }
    } else {
      console.log('✅ No cross-league data issues found!')
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message || error)
    console.error(error.stack)
    process.exit(1)
  }
}

runMigration().then(() => {
  console.log('\n✅ Done!')
  process.exit(0)
})
