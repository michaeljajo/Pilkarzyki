import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import { TakeoverHeader } from '@/components/nav/TakeoverHeader'
import { APP_CONTAINER } from '@/components/layout/appContainer'
import MidseasonDraftClient from './MidseasonDraftClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MidseasonDraftPage({ params }: Props) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const { id: leagueId } = await params

  const { data: userRecord } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', user.id)
    .single()
  if (!userRecord) redirect('/sign-in')

  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name, is_active')
    .eq('id', leagueId)
    .single()
  if (!league) redirect('/leagues')

  // Mid-season roster changes don't apply to an archived (read-only) season.
  if (league.is_active === false) redirect(`/leagues/${leagueId}`)

  const { isAdmin } = await verifyLeagueAdmin(user.id, leagueId)
  const { data: squad } = await supabaseAdmin
    .from('squads')
    .select('id')
    .eq('league_id', leagueId)
    .eq('manager_id', userRecord.id)
    .maybeSingle()

  if (!isAdmin && !squad) redirect('/leagues')

  return (
    /* dvh rather than min-h-screen — see the pre-season takeover for why. */
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Takeover: full-screen, no tab bar, one explicit exit. Shares AppShell's
          container so the left edge lines up with the rest of the app. */}
      <TakeoverHeader
        title={`Transfery — ${league.name}`}
        backHref={`/leagues/${leagueId}/squad`}
        backLabel="Wróć do składu"
      />

      {/* Matches the pre-season takeover: the live board sizes itself to one
          viewport and supplies its own bottom bar. */}
      <main className={`${APP_CONTAINER} pt-4 pb-0 md:py-8`}>
        <MidseasonDraftClient leagueId={leagueId} />
      </main>
    </div>
  )
}
