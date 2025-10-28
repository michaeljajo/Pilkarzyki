import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import { Trophy, Target, BarChart3, Settings, ArrowLeft, Table } from 'lucide-react'
import Image from 'next/image'

interface LeagueDashboardPageProps {
  params: Promise<{
    id: string
  }>
}

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

  // Get league details
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name, season, is_active, admin_id')
    .eq('id', leagueId)
    .single()

  if (!league) {
    redirect('/dashboard')
  }

  // Check if user is admin of this league
  const isAdmin = league.admin_id === userRecord.id

  // Check if user is a manager in this league (has a squad)
  const { data: squad } = await supabaseAdmin
    .from('squads')
    .select('id')
    .eq('league_id', leagueId)
    .eq('manager_id', userRecord.id)
    .single()

  const isManager = !!squad

  // User must be either admin or manager to access
  if (!isAdmin && !isManager) {
    redirect('/dashboard')
  }

  // Check if league has a cup
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id, name, stage')
    .eq('league_id', leagueId)
    .single()

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
              {isAdmin && (
                <Badge variant="info" size="sm">
                  <Settings size={12} />
                  Administrator
                </Badge>
              )}
              {isManager && (
                <Badge variant="success" size="sm">
                  Menedżer
                </Badge>
              )}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '64px', paddingBottom: '96px' }}>
        {/* League Header */}
        <div className="animate-fade-in-up mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {league.name}
          </h1>
          {league.season && (
            <p className="text-lg text-gray-600 leading-relaxed">Sezon {league.season}</p>
          )}
        </div>

        {/* Navigation Cards */}
        <div className="flex items-center justify-center min-h-[50vh] animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-center justify-center flex-wrap max-w-5xl gap-6">
            {isManager && (
              <Link href={`/dashboard/leagues/${leagueId}/squad`}>
                <div className="bg-white rounded-2xl border border-gray-200 hover-lift hover:shadow-xl group cursor-pointer min-w-[200px] text-center transition-shadow duration-200" style={{ padding: '40px 32px' }}>
                  <div className="w-16 h-16 mx-auto rounded-xl bg-[#29544D]/10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ marginBottom: '24px' }}>
                    <Target size={32} className="text-[#29544D]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900" style={{ marginBottom: '8px' }}>Wybierz drużynę</h3>
                </div>
              </Link>
            )}

            <Link href={`/dashboard/leagues/${leagueId}/results`}>
              <div className="bg-white rounded-2xl border border-gray-200 hover-lift hover:shadow-xl group cursor-pointer min-w-[200px] text-center transition-shadow duration-200" style={{ padding: '40px 32px' }}>
                <div className="w-16 h-16 mx-auto rounded-xl bg-[#3B82F6]/10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ marginBottom: '24px' }}>
                  <BarChart3 size={32} className="text-[#3B82F6]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900" style={{ marginBottom: '8px' }}>Wyniki</h3>
              </div>
            </Link>

            <Link href={`/dashboard/leagues/${leagueId}/standings`}>
              <div className="bg-white rounded-2xl border border-gray-200 hover-lift hover:shadow-xl group cursor-pointer min-w-[200px] text-center transition-shadow duration-200" style={{ padding: '40px 32px' }}>
                <div className="w-16 h-16 mx-auto rounded-xl bg-[#10B981]/10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ marginBottom: '24px' }}>
                  <Table size={32} className="text-[#10B981]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900" style={{ marginBottom: '8px' }}>Tabela</h3>
              </div>
            </Link>

            {hasCup && (
              <>
                <Link href={`/dashboard/leagues/${leagueId}/cup/results`}>
                  <div className="bg-white rounded-2xl border border-amber-200 hover-lift hover:shadow-xl group cursor-pointer min-w-[200px] text-center transition-shadow duration-200" style={{ padding: '40px 32px' }}>
                    <div className="w-16 h-16 mx-auto rounded-xl bg-amber-600/10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ marginBottom: '24px' }}>
                      <Trophy size={32} className="text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900" style={{ marginBottom: '8px' }}>🏆 Wyniki Pucharu</h3>
                  </div>
                </Link>

                <Link href={`/dashboard/leagues/${leagueId}/cup/standings`}>
                  <div className="bg-white rounded-2xl border border-amber-200 hover-lift hover:shadow-xl group cursor-pointer min-w-[200px] text-center transition-shadow duration-200" style={{ padding: '40px 32px' }}>
                    <div className="w-16 h-16 mx-auto rounded-xl bg-amber-600/10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ marginBottom: '24px' }}>
                      <Trophy size={32} className="text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900" style={{ marginBottom: '8px' }}>🏆 Tabela Pucharu</h3>
                  </div>
                </Link>
              </>
            )}

            {isAdmin && (
              <Link href={`/dashboard/admin/leagues/${leagueId}`}>
                <div className="bg-white rounded-2xl border border-gray-200 hover-lift hover:shadow-xl group cursor-pointer min-w-[200px] text-center transition-shadow duration-200" style={{ padding: '40px 32px' }}>
                  <div className="w-16 h-16 mx-auto rounded-xl bg-[#F59E0B]/10 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ marginBottom: '24px' }}>
                    <Settings size={32} className="text-[#F59E0B]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900" style={{ marginBottom: '8px' }}>Zarządzaj Ligą</h3>
                </div>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}