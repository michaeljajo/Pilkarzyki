import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { assertLeagueMutable } from '@/lib/auth-helpers'
import { resolveDraftAccess } from '@/lib/draft-helpers'

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  DRAFT_NOT_FOUND: { status: 404, message: 'Nie znaleziono draftu.' },
  NOT_MIDSEASON: { status: 400, message: 'To nie jest draft w trakcie sezonu.' },
  NOT_IN_DROPS: { status: 409, message: 'Okno zwolnień nie jest otwarte.' },
  NO_DROPS: { status: 409, message: 'Żaden menedżer nie zwolnił jeszcze zawodnika.' },
}

/**
 * Admin: close the drop window. Delegates to draft_close_drops(), which releases
 * every dropped player to the pool, sets each squad's pick quota = number
 * dropped, and moves the draft to 'setup' for ordering.
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
      return NextResponse.json({ error: 'Tylko administrator może zamknąć okno zwolnień.' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) return NextResponse.json({ error: mutable.error }, { status: mutable.status })

    const { data: draft } = await supabaseAdmin
      .from('drafts')
      .select('id')
      .eq('league_id', leagueId)
      .eq('kind', 'midseason')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!draft) return NextResponse.json({ error: 'Nie znaleziono draftu.' }, { status: 404 })

    const { data: updated, error } = await supabaseAdmin.rpc('draft_close_drops', {
      p_draft_id: draft.id,
    })

    if (error) {
      const raw = error.message || ''
      for (const key of Object.keys(ERROR_MAP)) {
        if (raw.includes(key)) {
          const m = ERROR_MAP[key]
          return NextResponse.json({ error: m.message }, { status: m.status })
        }
      }
      return NextResponse.json({ error: 'Nie udało się zamknąć okna zwolnień.' }, { status: 500 })
    }

    return NextResponse.json({ draft: updated })
  } catch (error) {
    console.error('POST midseason-draft close-drops error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
