import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveDraftAccess } from '@/lib/draft-helpers'

async function getDraftId(leagueId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('drafts')
    .select('id')
    .eq('league_id', leagueId)
    .maybeSingle()
  return data?.id ?? null
}

// List draft chat messages with sender names.
export async function GET(
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

    const draftId = await getDraftId(leagueId)
    if (!draftId) {
      return NextResponse.json({ messages: [] })
    }

    const { data, error } = await supabaseAdmin
      .from('draft_messages')
      .select('id, body, is_admin, created_at, user_id, users(first_name, last_name, email)')
      .eq('draft_id', draftId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching draft messages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = (data || []).map((m: any) => ({
      id: m.id,
      body: m.body,
      isAdmin: m.is_admin,
      createdAt: m.created_at,
      userId: m.user_id,
      senderName:
        [m.users?.first_name, m.users?.last_name].filter(Boolean).join(' ') ||
        m.users?.email ||
        'Menedżer',
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('GET draft messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Post a chat message.
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

    const body = await request.json()
    const text: string = typeof body?.body === 'string' ? body.body.trim() : ''
    if (!text) {
      return NextResponse.json({ error: 'Wiadomość nie może być pusta.' }, { status: 400 })
    }
    if (text.length > 500) {
      return NextResponse.json({ error: 'Wiadomość jest za długa (max 500 znaków).' }, { status: 400 })
    }

    const draftId = await getDraftId(leagueId)
    if (!draftId) {
      return NextResponse.json({ error: 'Nie znaleziono draftu.' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('draft_messages')
      .insert({
        draft_id: draftId,
        user_id: access.userInternalId,
        body: text,
        is_admin: !!access.isAdmin,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error posting draft message:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('POST draft messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
