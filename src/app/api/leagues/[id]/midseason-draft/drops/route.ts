import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable } from '@/lib/auth-helpers'
import { resolveDraftAccess } from '@/lib/draft-helpers'

/**
 * Manager: stage or unstage one of their own players for release during the drop
 * window. Body: { playerId, action: 'add' | 'remove' }. Only allowed while the
 * mid-season draft is in its 'drops' phase; a player can only be dropped by the
 * manager who currently owns it.
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
    if (!access.isManager || !access.squadId || !access.userInternalId) {
      return NextResponse.json({ error: 'Tylko menedżer może zwalniać zawodników.' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) return NextResponse.json({ error: mutable.error }, { status: mutable.status })

    const { playerId, action } = await request.json()
    if (!playerId || (action !== 'add' && action !== 'remove')) {
      return NextResponse.json({ error: 'Nieprawidłowe żądanie.' }, { status: 400 })
    }

    const { data: draft } = await supabaseAdmin
      .from('drafts')
      .select('id, status')
      .eq('league_id', leagueId)
      .eq('kind', 'midseason')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!draft) return NextResponse.json({ error: 'Nie znaleziono draftu.' }, { status: 404 })
    if (draft.status !== 'drops') {
      return NextResponse.json({ error: 'Okno zwolnień jest zamknięte.' }, { status: 409 })
    }

    if (action === 'remove') {
      await supabaseAdmin
        .from('draft_drops')
        .delete()
        .eq('draft_id', draft.id)
        .eq('player_id', playerId)
        .eq('manager_id', access.userInternalId)
      return NextResponse.json({ success: true })
    }

    // action === 'add': the player must currently belong to the caller.
    const { data: player } = await supabaseAdmin
      .from('players')
      .select('id, manager_id')
      .eq('id', playerId)
      .single()

    if (!player || player.manager_id !== access.userInternalId) {
      return NextResponse.json({ error: 'Możesz zwolnić tylko swojego zawodnika.' }, { status: 403 })
    }

    const { error } = await supabaseAdmin.from('draft_drops').insert({
      draft_id: draft.id,
      squad_id: access.squadId,
      manager_id: access.userInternalId,
      player_id: playerId,
    })

    if (error && error.code !== '23505') {
      // 23505 = already staged; treat as success (idempotent toggle).
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST midseason-draft drops error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
