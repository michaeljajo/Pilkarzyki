import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Trophy, Plus } from 'lucide-react'
import { LeaguesGrid } from '@/components/LeaguesGrid'  // NEW IMPORT
import { DashboardNav } from '@/components/DashboardNav'

// Cached function to get or create user record
const getUserRecord = unstable_cache(
  async (clerkId: string, email: string, firstName: string, lastName: string) => {
    let { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
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
        })
        .select('id')
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
    revalidate: 60,
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
        .eq('manager_id', userId),
      // Admin rights live in the league_admins junction table. The old query
      // filtered leagues.admin_id, which is NULL for every league, so it always
      // returned nothing — the global users.is_admin flag was silently doing all
      // the work. There is no global admin any more; rights are per league.
      supabaseAdmin
        .from('league_admins')
        .select(`
          league_id,
          leagues:league_id (
            id,
            name,
            season,
            is_active,
            created_at
          )
        `)
        .eq('user_id', userId)
    ])

    return {
      managerSquads: managerSquadsResult.data,
      adminLeagues: (adminLeaguesResult.data || [])
        .map((row: any) => row.leagues)
        .filter(Boolean),
      errors: {
        squadError: managerSquadsResult.error,
        adminError: adminLeaguesResult.error
      }
    }
  },
  ['user-leagues'],
  {
    revalidate: 30,
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

  const userRecord = await getUserRecord(user.id, email, firstName, lastName)

  if (!userRecord) {
    redirect('/sign-in')
  }

  const { managerSquads, adminLeagues } = await getUserLeagues(userRecord.id)

  const typedManagerSquads = managerSquads as Array<{
    league_id: string;
    leagues: {
      id: string;
      name: string;
      season: string;
      is_active: boolean;
      created_at: string;
    };
  }> | null;

  const managerLeagueIds = new Set(typedManagerSquads?.map(s => s.leagues.id) || [])
  // The leagues this user administers, by id — the only source of admin rights.
  const adminLeagueIds = new Set((adminLeagues || []).map(l => l.id))

  const allLeagues = [
    ...(typedManagerSquads?.map(item => ({
      id: item.leagues.id,
      name: item.leagues.name,
      season: item.leagues.season,
      is_active: item.leagues.is_active,
      created_at: item.leagues.created_at,
      isAdmin: adminLeagueIds.has(item.leagues.id),
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

  allLeagues.sort((a, b) => {
    // Active leagues first, then archived ones, then newest first within each group
    if (a.is_active !== b.is_active) {
      return a.is_active ? -1 : 1
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // Admin nav appears only if the user administers at least one ACTIVE league.
  const hasAdminAccess = adminLeagues?.some(l => l.is_active) ?? false

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <DashboardNav hasAdminAccess={hasAdminAccess} />

      {/* Main Content */}
      <main 
        style={{ 
          maxWidth: '1600px',  // Increased from 1400px
          marginLeft: 'auto', 
          marginRight: 'auto',
          paddingLeft: '32px',  // Reduced from 48px
          paddingRight: '32px', 
          paddingTop: '64px', 
          paddingBottom: '96px' 
        }}
      >
        <div className="animate-fade-in-up">
          {/* Header with Create Button */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '48px' 
            }}
          >
            <div>
              <h1 
                style={{ 
                  fontSize: '36px', 
                  fontWeight: 700, 
                  color: '#111827', 
                  lineHeight: 1.2 
                }}
              >
                Moje Ligi
              </h1>
            </div>
            <Link href="/leagues/new">
              <Button
                size="lg"
                icon={<Plus size={20} />}
                className="hover-lift"
              >
                Stwórz nową ligę
              </Button>
            </Link>
          </div>

          {/* Leagues Grid - NOW USING THE NEW COMPONENT */}
          {allLeagues.length === 0 ? (
            <div 
              style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                border: '1px solid #e5e7eb', 
                padding: '64px', 
                textAlign: 'center' 
              }}
            >
              <Trophy size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                Brak Aktywnych Lig
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Stwórz swoją pierwszą ligę, aby rozpocząć
              </p>
              <Link href="/leagues/new">
                <Button
                  size="lg"
                  icon={<Plus size={20} />}
                >
                  Stwórz nową ligę
                </Button>
              </Link>
            </div>
          ) : (
            <LeaguesGrid leagues={allLeagues} />
          )}
        </div>
      </main>
    </div>
  )
}
