import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { LeagueNavigationCards } from '@/components/LeagueNavigationCards'
import Image from 'next/image'

interface LeagueDashboardPageProps {
  params: Promise<{
    id: string
  }>
}

// Cached function to get league data with user access info in one query
const getLeagueData = unstable_cache(
  async (leagueId: string, userId: string) => {
    // Run all queries in parallel for performance
    const [leagueResult, squadResult, cupResult] = await Promise.all([
      supabaseAdmin
        .from('leagues')
        .select('id, name, season, is_active, admin_id')
        .eq('id', leagueId)
        .single(),
      supabaseAdmin
        .from('squads')
        .select('id')
        .eq('league_id', leagueId)
        .eq('manager_id', userId)
        .single(),
      supabaseAdmin
        .from('cups')
        .select('id, name, stage')
        .eq('league_id', leagueId)
        .single()
    ])

    return {
      league: leagueResult.data,
      squad: squadResult.data,
      cup: cupResult.data
    }
  },
  ['league-dashboard'],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ['league-dashboard']
  }
)

export default async function LeagueDashboardPage({ params }: LeagueDashboardPageProps) {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const { id: leagueId } = await params

  // Get user's internal ID
  const { data: userRecord } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', user.id)
    .single()

  if (!userRecord) {
    redirect('/sign-in')
  }

  // Get all league data in parallel with caching
  const { league, squad, cup } = await getLeagueData(leagueId, userRecord.id)

  if (!league) {
    redirect('/dashboard')
  }

  // Check if user is admin of this league
  const isAdmin = league.admin_id === userRecord.id
  const isManager = !!squad

  // User must be either admin or manager to access
  if (!isAdmin && !isManager) {
    redirect('/dashboard')
  }

  const hasCup = !!cup

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                <Image
                  src="/pilkarzyki-logo.png"
                  alt="Pilkarzyki"
                  width={200}
                  height={50}
                  priority
                />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-12 py-16 md:py-24">
        {/* Navigation Cards */}
        <div className="flex items-center justify-center animate-fade-in-up">
          <div className="w-full max-w-5xl">
            <LeagueNavigationCards
              leagueId={leagueId}
              isManager={isManager}
              isAdmin={isAdmin}
              hasCup={hasCup}
            />
          </div>
        </div>
      </main>
    </div>
  )
}