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
            {/* Mobile: Compact List Layout */}
            <div className="flex flex-col gap-3 md:hidden">
              {isManager && (
                <Link href={`/dashboard/leagues/${leagueId}/squad`} className="mx-2">
                  <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg group cursor-pointer transition-shadow duration-200 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-lg bg-[#29544D]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Target size={24} className="text-[#29544D]" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Wybierz drużynę</h3>
                  </div>
                </Link>
              )}

              <Link href={`/dashboard/leagues/${leagueId}/results`} className="mx-2">
                <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg group cursor-pointer transition-shadow duration-200 p-4 flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 size={24} className="text-[#3B82F6]" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Wyniki</h3>
                </div>
              </Link>

              <Link href={`/dashboard/leagues/${leagueId}/standings`} className="mx-2">
                <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg group cursor-pointer transition-shadow duration-200 p-4 flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-lg bg-[#10B981]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Table size={24} className="text-[#10B981]" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Tabela</h3>
                </div>
              </Link>

              {hasCup && (
                <>
                  <Link href={`/dashboard/leagues/${leagueId}/cup/results`} className="mx-2">
                    <div className="bg-white rounded-xl border border-amber-200 hover:shadow-lg group cursor-pointer transition-shadow duration-200 p-4 flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 rounded-lg bg-amber-600/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Trophy size={24} className="text-amber-600" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">🏆 Wyniki Pucharu</h3>
                    </div>
                  </Link>

                  <Link href={`/dashboard/leagues/${leagueId}/cup/standings`} className="mx-2">
                    <div className="bg-white rounded-xl border border-amber-200 hover:shadow-lg group cursor-pointer transition-shadow duration-200 p-4 flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 rounded-lg bg-amber-600/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Trophy size={24} className="text-amber-600" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">🏆 Tabela Pucharu</h3>
                    </div>
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link href={`/dashboard/admin/leagues/${leagueId}`} className="mx-2">
                  <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg group cursor-pointer transition-shadow duration-200 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Settings size={24} className="text-[#F59E0B]" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Zarządzaj Ligą</h3>
                  </div>
                </Link>
              )}
            </div>

            {/* Desktop: Card Grid Layout */}
            <div className="hidden md:flex flex-row items-center justify-center flex-wrap gap-6">
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
        </div>
      </main>
    </div>
  )
}