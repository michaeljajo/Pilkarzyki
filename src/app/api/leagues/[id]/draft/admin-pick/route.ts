import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable } from '@/lib/auth-helpers'
import { resolveDraftAccess, draftErrorToResponse } from '@/lib/draft-helpers'

// Admin: pick on behalf of whoever is currently on the clock (absent manager).
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
      return NextResponse.json({ error: 'Tylko administrator może wybierać za menedżera.' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    const body = await request.json()
    const playerId: string | undefined = body?.playerId
    if (!playerId) {
      return NextResponse.json({ error: 'Brak identyfikatora zawodnika.' }, { status: 400 })
    }

    const { data: draft } = await supabaseAdmin
      .from('drafts')
      .select('id')
      .eq('league_id', leagueId)
      .maybeSingle()

    if (!draft) {
      return NextResponse.json({ error: 'Nie znaleziono draftu.' }, { status: 404 })
    }

    const { data: updated, error } = await supabaseAdmin.rpc('draft_admin_pick', {
      p_draft_id: draft.id,
      p_player_id: playerId,
    })

    if (error) {
      const mapped = draftErrorToResponse(error)
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    return NextResponse.json({ draft: updated })
  } catch (error) {
    console.error('POST draft admin-pick error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
