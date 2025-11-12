import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { TablicaClient } from '@/components/TablicaClient'
import type { PostWithUser } from '@/types'

interface TablicaPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TablicaPage({ params }: TablicaPageProps) {
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
    .select('id, name, season, admin_id')
    .eq('id', leagueId)
    .single()

  if (!league) {
    redirect('/dashboard')
  }

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

  // Fetch posts for this league
  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select(`
      id,
      league_id,
      user_id,
      content,
      created_at,
      updated_at,
      users:user_id(
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })

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
      <main className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '48px', paddingBottom: '96px' }}>
        <div className="animate-fade-in-up">
          {/* Back Button */}
          <Link
            href={`/dashboard/leagues/${leagueId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span>Powrót do ligi</span>
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
              <MessageCircle size={28} className="text-[#6366F1]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                Tablica
              </h1>
              <p className="text-gray-600 mt-1">
                {league.name} - {league.season}
              </p>
            </div>
          </div>

          {/* Post Form and List */}
          <TablicaClient
            leagueId={leagueId}
            currentUserId={userRecord.id}
            isLeagueAdmin={isAdmin}
            initialPosts={(posts as any) || []}
          />
        </div>
      </main>
    </div>
  )
}
