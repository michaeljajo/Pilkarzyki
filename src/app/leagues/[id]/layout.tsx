import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { checkDefaultLineupGate } from '@/lib/default-lineup-gate'
import DefaultLineupGateScreen from '@/components/DefaultLineupGateScreen'

// Routes under /leagues/[id] that must never be gated: the admin ("manage")
// area and the full-screen takeovers (draft / mid-season draft). Admins manage
// a league without first setting their own lineup, and the takeovers run their
// own flow. The consumption pages (squad, league, cup, fixtures, more) are gated.
const GATE_EXEMPT = ['/manage', '/draft', '/midseason-draft']

interface LeagueLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

/**
 * League-section layout and single choke point for the mandatory default-lineup
 * ("żelazny skład") gate: a manager with a complete squad must have a valid
 * league (and cup, where applicable) default before they can use any page under
 * /leagues/[id]/... .
 *
 * When the gate is active we RENDER the default-lineup editor in place of the
 * requested page rather than redirecting to it. Redirecting from a shared layout
 * to a path under that same layout loops the App Router (history.replaceState
 * storm), so the gate is enforced by swapping content, not by changing the URL.
 * Admin pages live outside this layout and are never gated.
 */
export default async function LeagueLayout({ children, params }: LeagueLayoutProps) {
  const { id: leagueId } = await params

  const { userId } = await auth()
  if (!userId) {
    // Auth is enforced by middleware; if we somehow get here unauthenticated,
    // let the page/route handle it rather than gating.
    return <>{children}</>
  }

  // Skip the gate for the admin area and the full-screen takeovers.
  const pathname = (await headers()).get('x-pathname') ?? ''
  const subPath = pathname.replace(`/leagues/${leagueId}`, '')
  if (GATE_EXEMPT.some(prefix => subPath.startsWith(prefix))) {
    return <>{children}</>
  }

  const gate = await checkDefaultLineupGate(userId, leagueId)
  if (gate.active) {
    return (
      <DefaultLineupGateScreen
        leagueId={leagueId}
        stage={gate.stage ?? 1}
        removedPlayerNames={gate.removedPlayerNames}
      />
    )
  }

  return <>{children}</>
}
