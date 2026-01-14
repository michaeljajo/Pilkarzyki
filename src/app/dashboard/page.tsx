import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Trophy, Plus } from 'lucide-react'
import { LeagueCard } from '@/components/LeagueCard'
import { DashboardNav } from '@/components/DashboardNav'

// Cached function to get or create user record
const getUserRecord = unstable_cache(
  async (clerkId: string, email: string, firstName: string, lastName: string) => {
    let { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, is_admin')
      .eq('clerk_id', clerkId)
      .single()

    if (!userRecord) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          clerk_id: clerkId,
          email,
          first_name: firstName || email.split('@')[0] || 'User',
          last_name: lastName || '',
          is_admin: false
        })
        .select('id, is_admin')
        .single()

      if (createError || !newUser) {
        console.error('Error creating user record:', createError)
        return null
      }

      userRecord = newUser
    }

    return userRecord
  },
  ['user-record'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['user-record']
  }
)

// Cached function to get user's leagues
const getUserLeagues = unstable_cache(
  async (userId: string) => {
    const [managerSquadsResult, adminLeaguesResult] = await Promise.all([
      supabaseAdmin
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
        .eq('manager_id', userId)
        .eq('leagues.is_active', true),
      supabaseAdmin
        .from('leagues')
        .select('id, name, season, is_active, created_at, admin_id')
        .eq('admin_id', userId)
        .eq('is_active', true)
    ])

    return {
      managerSquads: managerSquadsResult.data,
      adminLeagues: adminLeaguesResult.data,
      errors: {
        squadError: managerSquadsResult.error,
        adminError: adminLeaguesResult.error
      }
    }
  },
  ['user-leagues'],
  {
    revalidate: 30, // Cache for 30 seconds - more frequent updates for league changes
    tags: ['user-leagues']
  }
)

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const email = user.emailAddresses[0]?.emailAddress || ''
  const firstName = user.firstName || ''
  const lastName = user.lastName || ''

  // Get user record with caching (60s cache)
  const userRecord = await getUserRecord(user.id, email, firstName, lastName)

  if (!userRecord) {
    redirect('/sign-in')
  }

  // Get user's leagues with caching (30s cache) and optimized parallel queries
  const { managerSquads, adminLeagues } = await getUserLeagues(userRecord.id)

  // Combine and deduplicate leagues
  // Type assertion for Supabase joined data
  const typedManagerSquads = managerSquads as Array<{
    league_id: string;
    leagues: {
      id: string;
      name: string;
      season: string;
      is_active: boolean;
      created_at: string;
      admin_id: string;
    };
  }> | null;

  const managerLeagueIds = new Set(typedManagerSquads?.map(s => s.leagues.id) || [])
  const adminLeagueIds = new Set(adminLeagues?.map(l => l.id) || [])

  const allLeagues = [
    ...(typedManagerSquads?.map(item => ({
      id: item.leagues.id,
      name: item.leagues.name,
      season: item.leagues.season,
      is_active: item.leagues.is_active,
      created_at: item.leagues.created_at,
      // User is admin if they're the league creator OR a global admin
      isAdmin: item.leagues.admin_id === userRecord.id || userRecord.is_admin === true,
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

  // User has admin access if they created any league OR are a global admin
  const hasAdminAccess = adminLeagueIds.size > 0 || userRecord.is_admin === true

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <DashboardNav hasAdminAccess={hasAdminAccess} />

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '64px', paddingBottom: '96px' }}>
        <div className="animate-fade-in-up">
          {/* Header with Create Button */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                Moje Ligi
              </h1>
            </div>
            <Link href="/dashboard/create-league">
              <Button
                size="lg"
                icon={<Plus size={20} />}
                className="hover-lift"
              >
                Stwórz nową ligę
              </Button>
            </Link>
          </div>

          {/* Leagues Grid */}
          {allLeagues.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Brak Aktywnych Lig
              </h3>
              <p className="text-gray-600 mb-6">
                Stwórz swoją pierwszą ligę, aby rozpocząć
              </p>
              <Link href="/dashboard/create-league">
                <Button
                  size="lg"
                  icon={<Plus size={20} />}
                >
                  Stwórz nową ligę
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
