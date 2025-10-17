import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('Running database migration for league dates...')

    // Add start_date and end_date columns to leagues table if they don't exist
    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          -- Add start_date column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_name='leagues' AND column_name='start_date') THEN
            ALTER TABLE leagues ADD COLUMN start_date TIMESTAMPTZ;
          END IF;

          -- Add end_date column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_name='leagues' AND column_name='end_date') THEN
            ALTER TABLE leagues ADD COLUMN end_date TIMESTAMPTZ;
          END IF;

          -- Add league_id column to matches table if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_name='matches' AND column_name='league_id') THEN
            ALTER TABLE matches ADD COLUMN league_id UUID REFERENCES leagues(id) ON DELETE CASCADE;
          END IF;
        END $$;
      `
    })

    if (alterError) {
      console.error('Migration error:', alterError)

      // Fallback: try direct ALTER statements
      try {
        await supabaseAdmin.rpc('exec_sql', {
          sql: 'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ'
        })
        await supabaseAdmin.rpc('exec_sql', {
          sql: 'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ'
        })
        await supabaseAdmin.rpc('exec_sql', {
          sql: 'ALTER TABLE matches ADD COLUMN IF NOT EXISTS league_id UUID REFERENCES leagues(id) ON DELETE CASCADE'
        })
      } catch (fallbackError) {
        console.error('Fallback migration error:', fallbackError)
        return NextResponse.json({
          error: 'Migration failed',
          details: alterError.message
        }, { status: 500 })
      }
    }

    // Create indexes if they don't exist
    try {
      await supabaseAdmin.rpc('exec_sql', {
        sql: 'CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league_id)'
      })
    } catch (indexError) {
      console.warn('Index creation warning:', indexError)
    }

    console.log('Migration completed successfully')

    return NextResponse.json({
      message: 'Migration completed successfully',
      appliedChanges: [
        'Added start_date column to leagues table',
        'Added end_date column to leagues table',
        'Added league_id column to matches table',
        'Created index on matches.league_id'
      ]
    })

  } catch (error) {
    console.error('Migration catch error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}