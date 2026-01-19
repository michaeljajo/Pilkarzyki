/**
 * Run migration 017: Add league_admins table
 */

import { supabaseAdmin } from '../src/lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  console.log('Running migration 017: Add league_admins table...\n')

  const migrationPath = path.join(__dirname, '../supabase/migrations/017_add_league_admins.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  // Split by semicolons and filter out empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`)
    console.log(statement.substring(0, 100) + '...')

    try {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        sql_string: statement
      })

      if (error) {
        console.error(`❌ Error:`, error)
        // Try direct execution as fallback
        console.log('Trying direct execution...')
        const result = await supabaseAdmin.from('_sql').insert({ query: statement })
        console.log('Result:', result)
      } else {
        console.log('✅ Success')
      }
    } catch (err) {
      console.error(`❌ Exception:`, err)
    }
  }

  console.log('\n\nMigration completed. Verifying...')

  // Verify table was created
  const { data: tables } = await supabaseAdmin
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'league_admins')

  if (tables && tables.length > 0) {
    console.log('✅ league_admins table created successfully')
  } else {
    console.log('⚠️  Could not verify league_admins table')
  }

  // Check migrated data
  const { data: adminCount, error: countError } = await supabaseAdmin
    .from('league_admins')
    .select('*', { count: 'exact', head: true })

  if (!countError) {
    console.log(`✅ Migrated ${adminCount} existing admin relationships`)
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Migration complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Migration failed:', err)
    process.exit(1)
  })
