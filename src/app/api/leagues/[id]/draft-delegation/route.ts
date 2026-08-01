import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable } from '@/lib/auth-helpers'
import {
  resolveDraftAccess,
  resolveDraftIdByKind,
  draftErrorToResponse,
  type DraftKind,
} from '@/lib/draft-helpers'

// Nominate (or revoke) a stand-in who picks for a manager who cannot attend.
// Serves both draft kinds — delegations are keyed by draft id.
//
// A manager may only manage the delegation of his own squad; a league admin may
// manage anyone's (managers phone the commissioner rather than clicking).

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

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    const body = await request.json()
    const kind: DraftKind = body?.kind === 'midseason' ? 'midseason' : 'preseason'
    const delegateUserId: string | null = body?.delegateUserId ?? null
    const squadId: string | null = body?.squadId ?? access.squadId ?? null

    if (!squadId) {
      return NextResponse.json({ error: 'Brak drużyny do wyznaczenia zastępcy.' }, { status: 400 })
    }
    if (squadId !== access.squadId && !access.isAdmin) {
      return NextResponse.json(
        { error: 'Możesz wyznaczyć zastępcę tylko dla siebie.' },
        { status: 403 }
      )
    }

    const draftId = await resolveDraftIdByKind(leagueId, kind)
    if (!draftId) {
      return NextResponse.json({ error: 'Nie znaleziono draftu.' }, { status: 404 })
    }

    const { error } = delegateUserId
      ? await supabaseAdmin.rpc('draft_set_delegation', {
          p_draft_id: draftId,
          p_squad_id: squadId,
          p_delegate_user_id: delegateUserId,
          p_created_by: access.userInternalId,
        })
      : await supabaseAdmin.rpc('draft_clear_delegation', {
          p_draft_id: draftId,
          p_squad_id: squadId,
        })

    if (error) {
      const mapped = draftErrorToResponse(error)
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    // No chat announcement. Every screen that matters already shows the current
    // stand-in (the roster row, the on-the-clock line, the delegation modal),
    // so posting one message per change only buried the real conversation —
    // especially while the admin was setting several of them up in a row.

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST draft delegation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
