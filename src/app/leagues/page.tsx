import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Trophy, Plus } from 'lucide-react'
import { LeaguesGrid } from '@/components/LeaguesGrid'
import { DashboardNav } from '@/components/DashboardNav'
import { APP_CONTAINER, APP_CONTENT_Y } from '@/components/layout/appContainer'

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
    revalidate: 60,
    tags: ['user-record']
  }
)

// Cached function to get user's leagues
const getUserLeagues = unstable_cache(
  async (userId: string) => {
    const [managerSquadsResult, adminLeaguesResult, publicLeaguesResult] = await Promise.all([
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
      // league_admins is the source of truth for who administers a league
      // (verifyLeagueAdmin uses it everywhere else); leagues.admin_id is the
      // deprecated single-admin column kept only for backward compatibility.
      supabaseAdmin
        .from('league_admins')
        .select('leagues!inner (id, name, season, is_active, created_at, admin_id)')
        .eq('user_id', userId),
      // Showcase leagues: visible to everyone signed in, so a new user has
      // something real to look at before joining anything of their own.
      supabaseAdmin
        .from('leagues')
        .select('id, name, season, is_active, created_at, admin_id')
        .eq('is_public', true)
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminLeagues = (adminLeaguesResult.data || []).map((row: any) => row.leagues)

    return {
      managerSquads: managerSquadsResult.data,
      adminLeagues,
      publicLeagues: publicLeaguesResult.data || [],
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

  const { managerSquads, adminLeagues, publicLeagues } = await getUserLeagues(userRecord.id)

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

  // Admin rights are per league. The global users.is_admin flag deliberately
  // plays no part here: it used to mark every league the user manages as one he
  // administers, which put admin-only affordances in front of plain managers.
  const adminLeagueIds = new Set(adminLeagues?.map(l => l.id) || [])

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
    })) || []),
    // Showcase leagues the user has no other relationship with — neither
    // manager nor admin, so they appear read-only and without admin controls.
    ...(publicLeagues
      ?.filter(l => !managerLeagueIds.has(l.id) && !adminLeagueIds.has(l.id))
      .map(league => ({
        id: league.id,
        name: league.name,
        season: league.season,
        is_active: league.is_active,
        created_at: league.created_at,
        isAdmin: false,
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

  return (
    // Same page surface as the league shell: gray-50 behind white cards, so the
    // landing page doesn't read as a different app from everything under it.
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />

      <main className={`${APP_CONTAINER} ${APP_CONTENT_Y}`}>
        {/* The visible "Moje Ligi" title is gone — the grid of leagues says that
            on its own. The h1 stays for screen readers and the document outline,
            which would otherwise have no heading at all. */}
        <h1 className="sr-only">Moje Ligi</h1>

        {/* Lone action: full-width on phones, right-aligned above the grid on
            wider screens, where the title used to sit opposite it. */}
        <div className="mb-6 flex">
          <Link href="/leagues/new" className="w-full sm:ml-auto sm:w-auto">
            <Button icon={<Plus size={18} />} fullWidth className="sm:w-auto">
              Stwórz nową ligę
            </Button>
          </Link>
        </div>

        {allLeagues.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <Trophy size={40} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Brak Aktywnych Lig
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Stwórz swoją pierwszą ligę, aby rozpocząć
            </p>
            <Link href="/leagues/new">
              <Button icon={<Plus size={18} />}>Stwórz nową ligę</Button>
            </Link>
          </div>
        ) : (
          <LeaguesGrid leagues={allLeagues} />
        )}
      </main>
    </div>
  )
}
