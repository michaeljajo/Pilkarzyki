import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable, verifyLeagueAdmin } from '@/lib/auth-helpers'

export interface DraftAccess {
  ok: boolean
  status?: number
  error?: string
  userInternalId?: string
  isAdmin?: boolean
  isManager?: boolean
  squadId?: string | null
}

/**
 * Resolves whether the current Clerk user may access a league's draft screen.
 * Access is granted to league admins and to managers (users who own a squad in
 * the league). Returns the caller's internal user id and their squad id (if any).
 */
export async function resolveDraftAccess(
  clerkUserId: string,
  leagueId: string
): Promise<DraftAccess> {
  const { data: userRecord } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .single()

  if (!userRecord) {
    return { ok: false, status: 404, error: 'Nie znaleziono użytkownika.' }
  }

  const { isAdmin } = await verifyLeagueAdmin(clerkUserId, leagueId)

  const { data: squad } = await supabaseAdmin
    .from('squads')
    .select('id')
    .eq('league_id', leagueId)
    .eq('manager_id', userRecord.id)
    .maybeSingle()

  const isManager = !!squad

  if (!isAdmin && !isManager) {
    return { ok: false, status: 403, error: 'Brak dostępu do tego draftu.' }
  }

  return {
    ok: true,
    userInternalId: userRecord.id,
    isAdmin,
    isManager,
    squadId: squad?.id ?? null,
  }
}

export type DraftKind = 'preseason' | 'midseason'

/**
 * Resolves the league's draft of a given kind. A league has at most one
 * pre-season draft, but may accumulate several mid-season ones — the latest is
 * the live one, matching what the mid-season routes already do.
 */
export async function resolveDraftIdByKind(
  leagueId: string,
  kind: DraftKind
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('drafts')
    .select('id')
    .eq('league_id', leagueId)
    .eq('kind', kind)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.id ?? null
}

/**
 * Maps a Postgres/Supabase error raised by the draft RPC functions to a Polish
 * user-facing message and an HTTP status.
 */
export function draftErrorToResponse(error: { message?: string; code?: string }): {
  status: number
  message: string
} {
  const raw = error?.message || ''

  // Unique-constraint backstop when two confirms race on the same player.
  if (error?.code === '23505' || raw.includes('draft_picks_draft_id_player_id_key')) {
    return { status: 409, message: 'Ten zawodnik został już wybrany' }
  }

  const map: Record<string, { status: number; message: string }> = {
    PLAYER_TAKEN: { status: 409, message: 'Ten zawodnik został już wybrany' },
    NOT_YOUR_TURN: { status: 403, message: 'To nie twoja kolej' },
    NO_TURN: { status: 409, message: 'Nikt nie jest teraz na kolejce.' },
    DRAFT_NOT_LIVE: { status: 409, message: 'Draft nie jest aktywny.' },
    DRAFT_NOT_FOUND: { status: 404, message: 'Nie znaleziono draftu.' },
    DRAFT_ALREADY_STARTED: { status: 409, message: 'Draft został już rozpoczęty.' },
    DRAFT_NOT_STARTED: { status: 409, message: 'Draft nie został jeszcze rozpoczęty.' },
    INVALID_ORDER: { status: 400, message: 'Nieprawidłowa kolejność draftu.' },
    PLAYER_NOT_FOUND: { status: 404, message: 'Nie znaleziono zawodnika.' },
    PLAYER_WRONG_LEAGUE: { status: 400, message: 'Ten zawodnik nie należy do tej ligi.' },
    PLAYER_NOT_AVAILABLE: { status: 409, message: 'Ten zawodnik nie jest dostępny (ma już menedżera).' },
    CANNOT_SKIP_LAST: {
      status: 409,
      message: 'Nie można pominąć ostatniego menedżera w rundzie — wybierz za niego.',
    },
    NOTHING_TO_UNDO: { status: 409, message: 'Brak wyborów do cofnięcia.' },
    // Raised by draft_set_delegation (032).
    DRAFT_FINISHED: { status: 409, message: 'Draft został zakończony.' },
    SQUAD_NOT_IN_LEAGUE: { status: 400, message: 'Ten menedżer nie należy do tej ligi.' },
    SELF_DELEGATION: { status: 400, message: 'Nie możesz wyznaczyć samego siebie na zastępcę.' },
    DELEGATE_NOT_IN_LEAGUE: {
      status: 400,
      message: 'Zastępcą może być tylko menedżer z tej ligi.',
    },
  }

  for (const key of Object.keys(map)) {
    if (raw.includes(key)) return map[key]
  }

  return { status: 500, message: 'Błąd serwera podczas przetwarzania draftu.' }
}

/**
 * Builds the POST handler for an admin-only draft action that delegates its
 * work to a Postgres RPC.
 *
 * The skip and undo routes were 58 lines each and differed in exactly three
 * places: the RPC name, the Polish 403 message and the log prefix. Everything
 * else — auth, admin check, archived-league check, resolving the preseason
 * draft, and mapping RPC errors to HTTP statuses — was duplicated verbatim.
 *
 * Ordering matters and is preserved: authenticate, then authorize, then reject
 * archived leagues, then look up the draft. Changing that order would leak
 * whether a draft exists to a non-admin.
 */
export function createDraftAdminAction(config: {
  rpc: 'draft_skip' | 'draft_undo'
  forbiddenMessage: string
  logLabel: string
}) {
  return async function POST(
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
        return NextResponse.json({ error: config.forbiddenMessage }, { status: 403 })
      }

      const mutable = await assertLeagueMutable(leagueId)
      if (!mutable.ok) {
        return NextResponse.json({ error: mutable.error }, { status: mutable.status })
      }

      const { data: draft } = await supabaseAdmin
        .from('drafts')
        .select('id')
        .eq('league_id', leagueId)
        .eq('kind', 'preseason')
        .maybeSingle()

      if (!draft) {
        return NextResponse.json({ error: 'Nie znaleziono draftu.' }, { status: 404 })
      }

      const { data: updated, error } = await supabaseAdmin.rpc(config.rpc, {
        p_draft_id: draft.id,
      })

      if (error) {
        const mapped = draftErrorToResponse(error)
        return NextResponse.json({ error: mapped.message }, { status: mapped.status })
      }

      return NextResponse.json({ draft: updated })
    } catch (error) {
      console.error(`${config.logLabel} error:`, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
