import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable } from '@/lib/auth-helpers'
import { resolveDraftAccess, draftErrorToResponse } from '@/lib/draft-helpers'

type Action = 'pick' | 'admin-pick' | 'skip' | 'undo'

/**
 * Live mid-season draft actions, dispatched to the shared engine RPCs:
 *   pick        → draft_make_pick   (manager on the clock)
 *   admin-pick  → draft_admin_pick  (admin, on behalf of whoever is on the clock)
 *   skip        → draft_skip        (admin defers the current manager)
 *   undo        → draft_undo        (admin reverts the last pick)
 * The RPCs enforce turn/order; quota-aware advancement + mid-season finalisation
 * live inside _draft_commit_pick / draft_undo.
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

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) return NextResponse.json({ error: mutable.error }, { status: mutable.status })

    const body = await request.json()
    const action: Action = body?.action
    const playerId: string | undefined = body?.playerId

    if (!['pick', 'admin-pick', 'skip', 'undo'].includes(action)) {
      return NextResponse.json({ error: 'Nieznana akcja.' }, { status: 400 })
    }
    if (action !== 'pick' && !access.isAdmin) {
      return NextResponse.json({ error: 'Ta akcja wymaga uprawnień administratora.' }, { status: 403 })
    }
    if (action === 'pick' && !access.isManager) {
      return NextResponse.json({ error: 'Tylko menedżer może wybierać zawodników.' }, { status: 403 })
    }

    const { data: draft } = await supabaseAdmin
      .from('drafts')
      .select('id')
      .eq('league_id', leagueId)
      .eq('kind', 'midseason')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!draft) return NextResponse.json({ error: 'Nie znaleziono draftu.' }, { status: 404 })

    let rpc: { data: unknown; error: { message?: string; code?: string } | null }

    if (action === 'pick') {
      if (!playerId) return NextResponse.json({ error: 'Brak zawodnika.' }, { status: 400 })
      rpc = await supabaseAdmin.rpc('draft_make_pick', {
        p_draft_id: draft.id,
        p_user_internal_id: access.userInternalId,
        p_player_id: playerId,
      })
    } else if (action === 'admin-pick') {
      if (!playerId) return NextResponse.json({ error: 'Brak zawodnika.' }, { status: 400 })
      rpc = await supabaseAdmin.rpc('draft_admin_pick', {
        p_draft_id: draft.id,
        p_player_id: playerId,
      })
    } else if (action === 'skip') {
      rpc = await supabaseAdmin.rpc('draft_skip', { p_draft_id: draft.id })
    } else {
      rpc = await supabaseAdmin.rpc('draft_undo', { p_draft_id: draft.id })
    }

    if (rpc.error) {
      const mapped = draftErrorToResponse(rpc.error)
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    return NextResponse.json({ draft: rpc.data })
  } catch (error) {
    console.error('POST midseason-draft action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
