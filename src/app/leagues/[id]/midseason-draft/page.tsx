import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import MidseasonDraftClient from './MidseasonDraftClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MidseasonDraftPage({ params }: Props) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const { id: leagueId } = await params

  const { data: userRecord } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', user.id)
    .single()
  if (!userRecord) redirect('/sign-in')

  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name, is_active')
    .eq('id', leagueId)
    .single()
  if (!league) redirect('/leagues')

  // Mid-season roster changes don't apply to an archived (read-only) season.
  if (league.is_active === false) redirect(`/leagues/${leagueId}`)

  const { isAdmin } = await verifyLeagueAdmin(user.id, leagueId)
  const { data: squad } = await supabaseAdmin
    .from('squads')
    .select('id')
    .eq('league_id', leagueId)
    .eq('manager_id', userRecord.id)
    .maybeSingle()

  if (!isAdmin && !squad) redirect('/leagues')

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/leagues" className="hover:opacity-80 transition-opacity">
                <Image src="/pilkarzyki-logo.png" alt="Pilkarzyki" width={200} height={50} priority />
              </Link>
              <span className="text-gray-400">/</span>
              <Link href={`/leagues/${leagueId}`} className="text-gray-600 hover:text-gray-900">
                {league.name}
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Draft w trakcie sezonu</span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 md:px-12 py-8">
        <MidseasonDraftClient leagueId={leagueId} />
      </main>
    </div>
  )
}
