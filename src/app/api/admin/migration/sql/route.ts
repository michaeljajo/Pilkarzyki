import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

// Simple migration helper - applies specific known migrations
async function applyKnownMigration(filename: string): Promise<{ success: boolean; message: string }> {
  if (filename === 'add_has_played_to_results.sql') {
    // Check if column already exists
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('results')
      .select('has_played')
      .limit(1)

    if (!checkError) {
      return {
        success: true,
        message: 'Migration already applied - has_played column exists'
      }
    }

    // Column doesn't exist, we need to add it
    // Since we can't execute raw DDL through Supabase JS client,
    // return instructions for manual application
    return {
      success: false,
      message: 'Please apply this migration manually through Supabase SQL Editor:\n\n' +
               '1. Go to your Supabase project dashboard\n' +
               '2. Navigate to SQL Editor\n' +
               '3. Run the following SQL:\n\n' +
               'ALTER TABLE results ADD COLUMN IF NOT EXISTS has_played BOOLEAN DEFAULT false;\n' +
               'CREATE INDEX IF NOT EXISTS idx_results_has_played ON results(has_played);\n' +
               'COMMENT ON COLUMN results.has_played IS \'Indicates whether the player has completed their game for this gameweek\';'
    }
  }

  return {
    success: false,
    message: 'Unknown migration file'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 })
    }

    // Security: Only allow .sql files
    if (!filename.endsWith('.sql')) {
      return NextResponse.json({ error: 'Only .sql files are allowed' }, { status: 400 })
    }

    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    // Read SQL file from migrations folder
    const migrationsDir = path.join(process.cwd(), 'migrations')
    const filePath = path.join(migrationsDir, filename)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Migration file not found' }, { status: 404 })
    }

    const sqlContent = fs.readFileSync(filePath, 'utf-8')

    // Try applying known migration
    const result = await applyKnownMigration(filename)

    if (result.success) {
      return NextResponse.json({
        message: result.message,
        filename
      })
    } else {
      // Return instructions
      return NextResponse.json({
        error: 'Manual migration required',
        instructions: result.message,
        sql: sqlContent
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to list available migration files
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const migrationsDir = path.join(process.cwd(), 'migrations')

    if (!fs.existsSync(migrationsDir)) {
      return NextResponse.json({ files: [] })
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .map(filename => {
        const stats = fs.statSync(path.join(migrationsDir, filename))
        return {
          filename,
          size: stats.size,
          modified: stats.mtime
        }
      })

    return NextResponse.json({ files })

  } catch (error) {
    console.error('List migrations error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
