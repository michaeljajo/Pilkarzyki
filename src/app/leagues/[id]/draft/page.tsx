import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import { TakeoverHeader } from '@/components/nav/TakeoverHeader'
import { APP_CONTAINER } from '@/components/layout/appContainer'
import { DraftClient } from './DraftClient'

interface DraftPageProps {
  params: Promise<{ id: string }>
}

export default async function DraftPage({ params }: DraftPageProps) {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const { id: leagueId } = await params

  const { data: userRecord } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', user.id)
    .single()

  if (!userRecord) {
    redirect('/sign-in')
  }

  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name, is_active')
    .eq('id', leagueId)
    .single()

  if (!league) {
    redirect('/leagues')
  }

  // The draft is a season-setup activity — archived (read-only) leagues have no
  // draft screen.
  if (league.is_active === false) {
    redirect(`/leagues/${leagueId}`)
  }

  const { isAdmin } = await verifyLeagueAdmin(user.id, leagueId)

  const { data: squad } = await supabaseAdmin
    .from('squads')
    .select('id')
    .eq('league_id', leagueId)
    .eq('manager_id', userRecord.id)
    .maybeSingle()

  const isManager = !!squad

  // Must be admin or a manager in this league.
  if (!isAdmin && !isManager) {
    redirect('/leagues')
  }

  return (
    /* dvh, not min-h-screen: `100vh` on mobile Safari is the viewport with the
       URL bar hidden, so pairing it with the board's `100dvh` left the page
       taller than the screen by exactly the URL-bar height — a scrollbar on a
       screen that is meant not to scroll. */
    /* gray-50 behind white cards, exactly like AppShell — on a white page the
       bordered panels had nothing to sit against and read as one flat sheet. */
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Takeover: full-screen, no tab bar, one explicit exit. Header and content
          share AppShell's container so the left edge does not jump when you
          cross into the draft. */}
      <TakeoverHeader
        title={`Draft — ${league.name}`}
        backHref={`/leagues/${leagueId}/squad`}
        backLabel="Wróć do składu"
      />

      {/* Phone: 1rem above, none below — the board is sized to exactly one
          viewport (see DraftLiveBoard) and ends in its own tab bar, which must
          meet the bottom edge. The height budget there assumes this pt-4. */}
      <main className={`${APP_CONTAINER} pt-4 pb-0 md:py-8`}>
        <DraftClient leagueId={leagueId} />
      </main>
    </div>
  )
}
