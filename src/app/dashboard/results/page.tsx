import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Trophy, BarChart3, ArrowRight, Settings } from 'lucide-react'

interface LeagueSummary {
  id: string
  name: string
  season: string
  is_active: boolean
  created_at: string
}

export default async function ResultsSelectorPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Get leagues where user is a manager (has a squad)
  let leagues: LeagueSummary[] = []
  try {
    // First get user's internal ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (userRecord) {
      // Get leagues where user has a squad (is a manager)
      const { data } = await supabaseAdmin
        .from('squads')
        .select(`
          league_id,
          leagues!inner (
            id,
            name,
            season,
            is_active,
            created_at
          )
        `)
        .eq('manager_id', userRecord.id)
        .eq('leagues.is_active', true)

      // Extract league data from the join
      leagues = data?.map(item => {
        const league = item.leagues as unknown as { id: string; name: string; season: string; is_active: boolean; created_at: string }
        return {
          id: league.id,
          name: league.name,
          season: league.season,
          is_active: league.is_active,
          created_at: league.created_at
        }
      }) || []
    }
  } catch (error) {
    console.error('Error fetching user leagues:', error)
  }

  // If user is only in one league, redirect directly to that league's results page
  if (leagues.length === 1) {
    redirect(`/dashboard/leagues/${leagues[0].id}/results`)
  }

  // Check if user is admin
  let isAdmin = false
  try {
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', user.id)
      .single()

    isAdmin = userRecord?.is_admin || false
  } catch (error) {
    console.log('Could not check admin status')
  }

  return (
    <div className="min-h-screen mesh-background">
      {/* Navigation Bar */}
      <nav className="glass-light sticky top-0 z-50 border-b border-[var(--navy-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--mineral-green)] to-[var(--bright-teal)] flex items-center justify-center">
                  <Trophy size={20} className="text-white" />
                </div>
                <h1 className="text-xl font-bold gradient-text-teal">
                  Pilkarzyki
                </h1>
              </Link>
              <span className="text-[var(--foreground-tertiary)]">/</span>
              <span className="text-[var(--foreground-secondary)]">Results</span>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Badge variant="info" size="sm">
                  <Settings size={12} className="mr-1" />
                  Admin
                </Badge>
              )}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in-up">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
              Match Results
            </h1>
            <p className="text-[var(--foreground-secondary)]">
              Choose a league to view results
            </p>
          </div>

          {leagues.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <BarChart3 size={48} className="mx-auto text-[var(--foreground-tertiary)] mb-4" />
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                No Active Leagues
              </h3>
              <p className="text-[var(--foreground-secondary)] mb-6">
                There are no active leagues available at the moment.
              </p>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leagues.map((league, index) => (
                <Link
                  key={league.id}
                  href={`/dashboard/leagues/${league.id}/results`}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="glass rounded-xl p-6 hover-lift hover-glow group cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-[var(--info)]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BarChart3 size={24} className="text-[var(--info)]" />
                      </div>
                      <Badge variant={league.is_active ? 'success' : 'outline'} size="sm">
                        {league.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                      {league.name}
                    </h3>
                    {league.season && (
                      <p className="text-sm text-[var(--foreground-tertiary)] mb-4">
                        Season {league.season}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--navy-border)]">
                      <span className="text-sm text-[var(--foreground-secondary)]">
                        View results
                      </span>
                      <ArrowRight
                        size={20}
                        className="text-[var(--info)] group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}