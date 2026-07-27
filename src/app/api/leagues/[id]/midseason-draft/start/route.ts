import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable } from '@/lib/auth-helpers'
import { resolveDraftAccess, draftErrorToResponse } from '@/lib/draft-helpers'

/**
 * Admin: start the mid-season draft with an ordered list of PARTICIPANT squads
 * (those that dropped at least one player, i.e. quota > 0). Order is decided by
 * the admin (goals-descending default with manual tie-breaks handled client-side)
 * and must contain exactly the participants, each once.
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

    const body = await request.json()
    const order: string[] = Array.isArray(body?.order) ? body.order : []

    const { data: draft } = await supabaseAdmin
      .from('drafts')
      .select('id, status, pick_quotas')
      .eq('league_id', leagueId)
      .eq('kind', 'midseason')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!draft) return NextResponse.json({ error: 'Nie znaleziono draftu.' }, { status: 404 })
    if (draft.status !== 'setup') {
      return NextResponse.json(
        { error: 'Najpierw zamknij okno zwolnień, aby ustalić kolejność.' },
        { status: 409 }
      )
    }

    // Participants = squads with a remaining quota > 0.
    const quotas: Record<string, number> = draft.pick_quotas || {}
    const participants = new Set(
      Object.entries(quotas)
        .filter(([, n]) => (n as number) > 0)
        .map(([sid]) => sid)
    )

    const orderSet = new Set(order)
    const validOrder =
      order.length >= 2 &&
      order.length === participants.size &&
      orderSet.size === order.length &&
      order.every((sid) => participants.has(sid))

    if (!validOrder) {
      return NextResponse.json(
        { error: 'Kolejność musi zawierać wszystkich uczestników draftu dokładnie raz.' },
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
    console.error('POST midseason-draft start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
