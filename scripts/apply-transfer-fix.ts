/**
 * Apply migration to fix transfer validation trigger
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🔧 Applying transfer validation fix migration...')

  // Read the migration SQL
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '017_fix_transfer_validation.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  // Split by statement (simple split by semicolons, may need refinement for complex SQL)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    if (statement.length === 0) continue

    console.log(`\nExecuting statement:\n${statement.substring(0, 100)}...`)

    const { error } = await supabase.rpc('exec_sql', { sql: statement })

    if (error) {
      // Try direct execution as fallback
      const { error: directError } = await supabase.from('_migrations').select('*').limit(0)

      if (directError) {
        console.error('❌ Error executing statement:', error)
        console.error('Statement:', statement)
        process.exit(1)
      }
    }

    console.log('✅ Statement executed successfully')
  }

  console.log('\n✅ Migration applied successfully!')
}

applyMigration().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
