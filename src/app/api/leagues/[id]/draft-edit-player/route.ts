import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable } from '@/lib/auth-helpers'
import { resolveDraftAccess } from '@/lib/draft-helpers'

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']

/**
 * Admin: edit a player's details live during a draft (e.g. a last-minute
 * transfer) without re-importing the pool or restarting. Updates the player and
 * bumps the league's active (unfinished) draft so every connected client — this
 * works for both the pre-season and mid-season drafts — refetches via realtime.
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
      return NextResponse.json({ error: 'Tylko administrator może edytować zawodnika.' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) return NextResponse.json({ error: mutable.error }, { status: mutable.status })

    const body = await request.json()
    const playerId = String(body?.playerId ?? '')
    const name = String(body?.name ?? '').trim()
    const surname = String(body?.surname ?? '').trim()
    const club = String(body?.club ?? '').trim()
    const position = String(body?.position ?? '').trim()
    const footballLeague = body?.footballLeague ? String(body.footballLeague).trim() || null : null

    if (!playerId || !name || !club || !position) {
      return NextResponse.json({ error: 'Wymagane pola: Imię, Klub, Pozycja.' }, { status: 400 })
    }
    if (!POSITIONS.includes(position)) {
      return NextResponse.json({ error: 'Nieprawidłowa pozycja.' }, { status: 400 })
    }

    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('name')
      .eq('id', leagueId)
      .single()
    if (!league) return NextResponse.json({ error: 'Nie znaleziono ligi.' }, { status: 404 })

    // The player must belong to this league's pool.
    const { data: player } = await supabaseAdmin
      .from('players')
      .select('id, league')
      .eq('id', playerId)
      .single()
    if (!player || player.league !== league.name) {
      return NextResponse.json({ error: 'Zawodnik nie należy do tej ligi.' }, { status: 404 })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('players')
      .update({ name, surname, club, football_league: footballLeague, position, updated_at: new Date().toISOString() })
      .eq('id', playerId)
      .select('id, name, surname, club, football_league, position')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Broadcast to every draft client for this league (pre-season or mid-season).
    await supabaseAdmin
      .from('drafts')
      .update({ updated_at: new Date().toISOString() })
      .eq('league_id', leagueId)
      .neq('status', 'finished')

    return NextResponse.json({ success: true, player: updated })
  } catch (error) {
    console.error('POST draft-edit-player error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
