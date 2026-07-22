import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable } from '@/lib/auth-helpers'
import { resolveDraftAccess, draftErrorToResponse } from '@/lib/draft-helpers'

// Admin: start the draft with an ordered list of squad ids.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id: leagueId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const access = await resolveDraftAccess(userId, leagueId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    if (!access.isAdmin) {
      return NextResponse.json({ error: 'Tylko administrator może rozpocząć draft.' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    const body = await request.json()
    const order: string[] = Array.isArray(body?.order) ? body.order : []

    const { data: draft } = await supabaseAdmin
      .from('drafts')
      .select('id')
      .eq('league_id', leagueId)
      .maybeSingle()

    if (!draft) {
      return NextResponse.json({ error: 'Nie znaleziono draftu.' }, { status: 404 })
    }

    // Validate the order contains exactly the league's squads, no duplicates.
    const { data: squads } = await supabaseAdmin
      .from('squads')
      .select('id')
      .eq('league_id', leagueId)

    const squadIds = new Set((squads || []).map(s => s.id))
    const orderSet = new Set(order)
    const validOrder =
      order.length >= 2 &&
      order.length === squadIds.size &&
      orderSet.size === order.length &&
      order.every(sid => squadIds.has(sid))

    if (!validOrder) {
      return NextResponse.json(
        { error: 'Kolejność musi zawierać wszystkich menedżerów ligi dokładnie raz.' },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabaseAdmin.rpc('draft_start', {
      p_draft_id: draft.id,
      p_pick_order: order,
    })

    if (error) {
      const mapped = draftErrorToResponse(error)
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    return NextResponse.json({ draft: updated })
  } catch (error) {
    console.error('POST draft start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
