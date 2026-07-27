import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin, assertLeagueMutable } from '@/lib/auth-helpers'
import { getNextTransferDate, validateTransferDate } from '@/utils/transfer-resolver'

// Map the swap RPC's raised exceptions to Polish, user-facing messages.
const ERROR_MAP: Record<string, { status: number; message: string }> = {
  SAME_PLAYER: { status: 400, message: 'Wybierz dwóch różnych zawodników.' },
  SAME_MANAGER: { status: 400, message: 'Zawodnicy należą do tego samego menedżera.' },
  LEAGUE_NOT_FOUND: { status: 404, message: 'Nie znaleziono ligi.' },
  PLAYER_NOT_FOUND: { status: 404, message: 'Nie znaleziono zawodnika.' },
  PLAYER_WRONG_LEAGUE: { status: 400, message: 'Zawodnik nie należy do tej ligi.' },
  PLAYER_UNASSIGNED: { status: 400, message: 'Obaj zawodnicy muszą mieć przypisanego menedżera.' },
  SQUAD_NOT_FOUND: { status: 404, message: 'Nie znaleziono składu menedżera.' },
}

function mapRpcError(raw: string): { status: number; message: string } {
  for (const key of Object.keys(ERROR_MAP)) {
    if (raw.includes(key)) return ERROR_MAP[key]
  }
  return { status: 500, message: 'Błąd serwera podczas wymiany zawodników.' }
}

/**
 * POST /api/admin/leagues/[id]/swap — exchange one player between two managers.
 * Body: { playerAId, playerBId }. Delegates to the atomic admin_swap_players RPC
 * (two swap-type transfers + the squad junction) so the swap can't half-apply.
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

    const { playerAId, playerBId } = await request.json()
    if (!playerAId || !playerBId) {
      return NextResponse.json({ error: 'Wybierz po jednym zawodniku z każdej strony.' }, { status: 400 })
    }
    if (playerAId === playerBId) {
      return NextResponse.json({ error: 'Wybierz dwóch różnych zawodników.' }, { status: 400 })
    }

    // Effective from the next unlocked gameweek; fall back to now for a league
    // whose season has not started (no upcoming gameweek yet).
    const effectiveFrom = (await getNextTransferDate(leagueId)) ?? new Date()

    // Never let a swap reach into an already locked/completed gameweek.
    const dateCheck = await validateTransferDate(leagueId, effectiveFrom)
    if (!dateCheck.isValid) {
      return NextResponse.json({ error: dateCheck.error || 'Nieprawidłowa data wymiany.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.rpc('admin_swap_players', {
      p_league_id: leagueId,
      p_player_a: playerAId,
      p_player_b: playerBId,
      p_effective_from: effectiveFrom.toISOString(),
      p_created_by: userInternalId ?? null,
    })

    if (error) {
      const mapped = mapRpcError(error.message || '')
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    return NextResponse.json({
      message: 'Wymiana zawodników zakończona pomyślnie.',
      effectiveFrom: effectiveFrom.toISOString(),
    })
  } catch (error) {
    console.error('Error in player swap:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
