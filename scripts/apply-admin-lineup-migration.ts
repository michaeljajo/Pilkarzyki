#!/usr/bin/env tsx

/**
 * Script to apply admin lineup tracking migration to production database
 * This adds created_by_admin and admin_creator_id columns to the lineups table
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('Applying admin lineup tracking migration...')

    // Read the migration SQL file
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '003_add_admin_lineup_tracking.sql'
    )

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      console.error('Error applying migration:', error)

      // Try alternative approach: execute statements one by one
      console.log('Trying alternative approach...')

      // Add created_by_admin column
      const { error: error1 } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE lineups ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT FALSE;`
      })

      if (error1) {
        console.error('Error adding created_by_admin column:', error1)
      } else {
        console.log('✓ Added created_by_admin column')
      }

      // Add admin_creator_id column
      const { error: error2 } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE lineups ADD COLUMN IF NOT EXISTS admin_creator_id UUID REFERENCES users(id) ON DELETE SET NULL;`
      })

      if (error2) {
        console.error('Error adding admin_creator_id column:', error2)
      } else {
        console.log('✓ Added admin_creator_id column')
      }

      process.exit(1)
    }

    console.log('✓ Migration applied successfully')
    console.log('Data:', data)
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

applyMigration()
