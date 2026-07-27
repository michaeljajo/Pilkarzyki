import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable } from '@/lib/auth-helpers'
import { resolveDraftAccess, draftErrorToResponse } from '@/lib/draft-helpers'

// Admin: undo the most recent pick (repeatable).
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
      return NextResponse.json({ error: 'Tylko administrator może cofać wybory.' }, { status: 403 })
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

    const { data: updated, error } = await supabaseAdmin.rpc('draft_undo', {
      p_draft_id: draft.id,
    })

    if (error) {
      const mapped = draftErrorToResponse(error)
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    return NextResponse.json({ draft: updated })
  } catch (error) {
    console.error('POST draft undo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
