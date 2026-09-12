import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin, assertLeagueMutable } from '@/lib/auth-helpers'
import { getNextTransferDate, validateTransferDate } from '@/utils/transfer-resolver'
import {
  validateReplacement,
  mapReplacementRpcError,
  replacementNote,
  playerFullName,
  type ReplacementPlayerRef,
} from '@/lib/player-replacement'

const PLAYER_COLUMNS = 'id, name, surname, position, club, football_league, manager_id, league_id'

/**
 * POST /api/admin/leagues/[id]/replace-player — swap one player in a manager's
 * squad for a free agent from the pool. Used when a player leaves the ten
 * football leagues the game covers and his manager is owed a replacement.
 *
 * Body: { managerId, playerOutId, playerInId }. Delegates the write to the
 * atomic admin_replace_player RPC, which repeats these checks under row locks.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leagueId } = await params
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isAdmin, userInternalId } = await verifyLeagueAdmin(userId, leagueId)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Brak uprawnień administratora tej ligi.' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    const body = await request.json()
    const managerId = String(body?.managerId ?? '')
    const playerOutId = String(body?.playerOutId ?? '')
    const playerInId = String(body?.playerInId ?? '')

    if (!managerId || !playerOutId || !playerInId) {
      return NextResponse.json(
        { error: 'Wybierz menedżera oraz zawodnika odchodzącego i wchodzącego.' },
        { status: 400 }
      )
    }

    const { data: rows, error: playersError } = await supabaseAdmin
      .from('players')
      .select(PLAYER_COLUMNS)
      .in('id', [playerOutId, playerInId])

    if (playersError) {
      console.error('Error loading players for replacement:', playersError)
      return NextResponse.json({ error: 'Nie udało się wczytać zawodników.' }, { status: 500 })
    }

    const players = (rows ?? []) as ReplacementPlayerRef[]
    const playerOut = players.find((p) => p.id === playerOutId) ?? null
    const playerIn = players.find((p) => p.id === playerInId) ?? null

    const check = validateReplacement({ leagueId, managerId, playerOut, playerIn })
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    // Effective from the next unlocked gameweek; fall back to now for a league
    // whose season has not started (no upcoming gameweek yet).
    const effectiveFrom = (await getNextTransferDate(leagueId)) ?? new Date()

    // Never let a replacement reach into an already locked/completed gameweek.
    const dateCheck = await validateTransferDate(leagueId, effectiveFrom)
    if (!dateCheck.isValid) {
      return NextResponse.json(
        { error: dateCheck.error || 'Nieprawidłowa data zmiany.' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.rpc('admin_replace_player', {
      p_league_id: leagueId,
      p_manager_id: managerId,
      p_player_out: playerOutId,
      p_player_in: playerInId,
      p_effective_from: effectiveFrom.toISOString(),
      p_created_by: userInternalId ?? null,
      // Non-null assertions are safe: validateReplacement returned ok, which it
      // only does once both players resolved.
      p_notes: replacementNote(playerOut!, playerIn!),
    })

    if (error) {
      const mapped = mapReplacementRpcError(error.message || '')
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    return NextResponse.json({
      message: `${playerFullName(playerOut!)} → ${playerFullName(playerIn!)}. Zmiana zakończona pomyślnie.`,
      effectiveFrom: effectiveFrom.toISOString(),
    })
  } catch (error) {
    console.error('Error in player replacement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
