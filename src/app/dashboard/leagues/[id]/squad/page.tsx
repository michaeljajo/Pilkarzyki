import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { LeagueNavigation } from '@/components/LeagueNavigation'
import SquadSelection from '@/components/SquadSelection'

interface SquadPageProps {
  params: Promise<{ id: string }>
}

export default async function SquadPage({ params }: SquadPageProps) {
  const user = await currentUser()
  const resolvedParams = await params

  if (!user) {
    redirect('/sign-in')
  }

  // Fetch league name
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('name')
    .eq('id', resolvedParams.id)
    .single()

  const leagueName = league?.name || 'League'

  return (
    <div className="min-h-screen bg-white">
      <LeagueNavigation
        leagueId={resolvedParams.id}
        leagueName={leagueName}
        currentPage="squad"
      />

      <main className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '8px', paddingBottom: '16px' }}>
        <SquadSelection leagueId={resolvedParams.id} />
      </main>
    </div>
  )
}