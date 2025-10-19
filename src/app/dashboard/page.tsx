import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Trophy, Plus, Settings } from 'lucide-react'
import Image from 'next/image'
import { LeagueCard } from '@/components/LeagueCard'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Get user's internal ID
  const { data: userRecord } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', user.id)
    .single()

  if (!userRecord) {
    redirect('/sign-in')
  }

  // Get leagues where user is a manager (has a squad)
  const { data: managerSquads, error: squadError } = await supabaseAdmin
    .from('squads')
    .select(`
      league_id,
      leagues!inner (
        id,
        name,
        season,
        is_active,
        created_at,
        admin_id
      )
    `)
    .eq('manager_id', userRecord.id)
    .eq('leagues.is_active', true)

  // Get leagues where user is admin
  const { data: adminLeagues, error: adminError } = await supabaseAdmin
    .from('leagues')
    .select('id, name, season, is_active, created_at, admin_id')
    .eq('admin_id', userRecord.id)
    .eq('is_active', true)

  // Debug logging
  console.log('=== DASHBOARD DEBUG ===')
  console.log('User email:', user.emailAddresses[0]?.emailAddress)
  console.log('User internal ID:', userRecord.id)
  console.log('Manager squads:', managerSquads)
  console.log('Squad error:', squadError)
  console.log('Admin leagues:', adminLeagues)
  console.log('Admin error:', adminError)

  // Combine and deduplicate leagues
  const managerLeagueIds = new Set(managerSquads?.map(s => s.leagues.id) || [])
  const adminLeagueIds = new Set(adminLeagues?.map(l => l.id) || [])

  const allLeagues = [
    ...(managerSquads?.map(item => ({
      id: item.leagues.id,
      name: item.leagues.name,
      season: item.leagues.season,
      is_active: item.leagues.is_active,
      created_at: item.leagues.created_at,
      isAdmin: item.leagues.admin_id === userRecord.id,
      isManager: true
    })) || []),
    ...(adminLeagues?.filter(l => !managerLeagueIds.has(l.id)).map(league => ({
      id: league.id,
      name: league.name,
      season: league.season,
      is_active: league.is_active,
      created_at: league.created_at,
      isAdmin: true,
      isManager: false
    })) || [])
  ]

  // Sort by creation date (newest first)
  allLeagues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const hasAdminAccess = adminLeagueIds.size > 0

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/pilkarzyki-logo.png"
                alt="Pilkarzyki"
                width={200}
                height={50}
                priority
              />
            </div>
            <div className="flex items-center gap-4">
              {hasAdminAccess && (
                <Badge variant="info" size="sm">
                  <Settings size={12} />
                  Admin
                </Badge>
              )}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '64px', paddingBottom: '96px' }}>
        <div className="animate-fade-in-up">
          {/* Header with Create Button */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                My Leagues
              </h1>
            </div>
            <Link href="/dashboard/create-league">
              <Button
                size="lg"
                icon={<Plus size={20} />}
                className="hover-lift"
              >
                Create a new league
              </Button>
            </Link>
          </div>

          {/* Leagues Grid */}
          {allLeagues.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Active Leagues
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first league to get started
              </p>
              <Link href="/dashboard/create-league">
                <Button
                  size="lg"
                  icon={<Plus size={20} />}
                >
                  Create a new league
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '48px', padding: '8px' }}>
              {allLeagues.map((league, index) => (
                <LeagueCard
                  key={league.id}
                  league={league}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
