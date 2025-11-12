import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Check if has_played column exists by trying to select it
    const { data, error } = await supabaseAdmin
      .from('results')
      .select('id, has_played')
      .limit(1)

    if (error) {
      if (error.message.includes('has_played')) {
        return NextResponse.json({
          success: false,
          message: 'Migration NOT applied',
          details: 'has_played column does not exist in results table',
          error: error.message
        })
      }
      return NextResponse.json({
        success: false,
        message: 'Error checking migration',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Migration applied successfully!',
      details: {
        columnExists: true,
        sampleData: data
      }
    })

  } catch (error) {
    console.error('Verify migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
