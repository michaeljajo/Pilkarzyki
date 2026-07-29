import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { checkDefaultLineupGate } from '@/lib/default-lineup-gate'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import DefaultLineupGateScreen from '@/components/DefaultLineupGateScreen'
import { AppShell } from '@/components/nav/AppShell'

interface LeagueLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

// Routes under /leagues/[id] that must never be gated: the admin ("manage")
// area and the full-screen takeovers (draft / mid-season draft). Admins manage
// a league without first setting their own lineup, and the takeovers run their
// own flow. The consumption pages (squad, league, cup, fixtures, more) are gated.
const GATE_EXEMPT = ['/manage', '/draft', '/midseason-draft']

async function getLeagueShellData(leagueId: string) {
  const [leagueResult, cupResult] = await Promise.all([
    supabaseAdmin.from('leagues').select('id, name').eq('id', leagueId).single(),
    supabaseAdmin.from('cups').select('id').eq('league_id', leagueId).maybeSingle(),
  ])
  if (leagueResult.error || !leagueResult.data) return null
  return {
    name: leagueResult.data.name as string,
    hasCup: !!cupResult.data,
  }
}

/**
 * League-section layout: renders the unified AppShell (sticky header + tab bar)
 * around every route under /leagues/[id], and is the single choke point for the
 * mandatory default-lineup ("żelazny skład") gate.
 *
 * When the gate is active we render the default-lineup editor in place of the
 * requested page (inside the shell) rather than redirecting — redirecting from a
 * shared layout to a path under it loops the App Router. The admin area and the
 * takeovers are exempt from the gate; the AppShell itself drops its chrome on
 * takeover routes so they render full-screen.
 */
export default async function LeagueLayout({ children, params }: LeagueLayoutProps) {
  const { id: leagueId } = await params

  const shell = await getLeagueShellData(leagueId)
  if (!shell) notFound()

  const { userId } = await auth()

  let isAdmin = false
  let content = children
  if (userId) {
    isAdmin = (await verifyLeagueAdmin(userId, leagueId)).isAdmin

    const pathname = (await headers()).get('x-pathname') ?? ''
    const subPath = pathname.replace(`/leagues/${leagueId}`, '')
    const exempt = GATE_EXEMPT.some((prefix) => subPath.startsWith(prefix))
    if (!exempt) {
      const gate = await checkDefaultLineupGate(userId, leagueId)
      if (gate.active) {
        content = (
          <DefaultLineupGateScreen
            leagueId={leagueId}
            stage={gate.stage ?? 1}
            removedPlayerNames={gate.removedPlayerNames}
          />
        )
      }
    }
  }

  return (
    <AppShell leagueId={leagueId} leagueName={shell.name} hasCup={shell.hasCup} isAdmin={isAdmin}>
      {content}
    </AppShell>
  )
}
