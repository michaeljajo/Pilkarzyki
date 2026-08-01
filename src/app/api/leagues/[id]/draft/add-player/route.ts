import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable } from '@/lib/auth-helpers'
import { resolveDraftAccess } from '@/lib/draft-helpers'
import { resolvePosition, splitFullName, ALLOWED_POSITIONS_PL } from '@/lib/draft-players'

// Admin: add a single player to the pool at any time — including while the
// draft is live (e.g. a wanted player was missing from the imported table).
// The new player becomes immediately available to pick, and bumping the draft
// row broadcasts the change to all connected clients via realtime.
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
      return NextResponse.json({ error: 'Tylko administrator może dodać zawodnika.' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    const body = await request.json()
    const fullName = String(body?.fullName ?? '').trim()
    const club = String(body?.club ?? '').trim()
    const rawPosition = String(body?.position ?? '').trim()
    const footballLeague = body?.footballLeague ? String(body.footballLeague).trim() || null : null

    if (!fullName || !club || !rawPosition) {
      return NextResponse.json(
        { error: 'Wymagane pola: Imię i Nazwisko, Klub, Pozycja.' },
        { status: 400 }
      )
    }

    const { name, surname } = splitFullName(fullName)
    if (!name) {
      return NextResponse.json({ error: 'Nieprawidłowe imię i nazwisko.' }, { status: 400 })
    }

    const position = resolvePosition(rawPosition)
    if (!position) {
      return NextResponse.json(
        { error: `Nieprawidłowa pozycja. Dozwolone: ${ALLOWED_POSITIONS_PL}` },
        { status: 400 }
      )
    }

    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .eq('id', leagueId)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'Nie znaleziono ligi.' }, { status: 404 })
    }

    // Typo guard, not a uniqueness rule: the pool legitimately contains
    // different players who share a name (e.g. "Vitinha" at PSG and at Genoa),
    // so only a same-name-AND-same-club row counts as a duplicate. limit(1)
    // keeps this defined even when several rows share the name.
    const { data: existing } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('name', name)
      .eq('surname', surname)
      .eq('club', club)
      .eq('league', league.name)
      .limit(1)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: `Zawodnik "${fullName}" (${club}) już istnieje w tej lidze.` },
        { status: 409 }
      )
    }

    const { data: player, error: insertError } = await supabaseAdmin
      .from('players')
      .insert({
        name,
        surname,
        league: league.name,
        position,
        club,
        football_league: footballLeague,
        manager_id: null,
        total_goals: 0,
      })
      .select('id, name, surname, club, football_league, position')
      .single()

    if (insertError) {
      console.error('Error adding player:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Broadcast: bumping the draft row triggers the realtime subscription on
    // every client, which refetches the snapshot (and picks up the new player).
    await supabaseAdmin
      .from('drafts')
      .update({ updated_at: new Date().toISOString() })
      .eq('league_id', leagueId)
      .eq('kind', 'preseason')

    return NextResponse.json({ success: true, player })
  } catch (error) {
    console.error('POST draft add-player error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
