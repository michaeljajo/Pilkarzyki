import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: cupId } = await context.params

    const { data: cupGameweeks, error } = await supabaseAdmin
      .from('cup_gameweeks')
      .select(`
        *,
        gameweeks:league_gameweek_id (
          id,
          week,
          start_date,
          end_date,
          lock_date
        )
      `)
      .eq('cup_id', cupId)
      .order('cup_week', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cupGameweeks: cupGameweeks || [] })

  } catch (error) {
    console.error('Error fetching cup gameweeks:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
