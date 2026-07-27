import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable } from '@/lib/auth-helpers'
import { resolveDraftAccess } from '@/lib/draft-helpers'

/**
 * Admin: open a mid-season draft in its drop window ('drops'). At most one
 * unfinished draft may exist per league (enforced by a partial unique index),
 * so any in-progress pre-season or earlier draft must be finished first.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id: leagueId } = await params
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await resolveDraftAccess(userId, leagueId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!access.isAdmin) {
      return NextResponse.json({ error: 'Tylko administrator może rozpocząć draft.' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) return NextResponse.json({ error: mutable.error }, { status: mutable.status })

    // Friendly pre-check (the partial unique index is the hard backstop).
    const { data: active } = await supabaseAdmin
      .from('drafts')
      .select('id, kind, status')
      .eq('league_id', leagueId)
      .neq('status', 'finished')
      .maybeSingle()

    if (active) {
      return NextResponse.json(
        { error: 'Najpierw zakończ obecny draft, zanim rozpoczniesz nowy.' },
        { status: 409 }
      )
    }

    const { data: draft, error } = await supabaseAdmin
      .from('drafts')
      .insert({ league_id: leagueId, kind: 'midseason', status: 'drops' })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('POST midseason-draft create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
