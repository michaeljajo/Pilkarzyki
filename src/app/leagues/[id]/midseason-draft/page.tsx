import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
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
      {/* Takeover header: full-screen, no tab bar, with a single explicit exit. */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1100px] mx-auto h-16 px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Image src="/pilkarzyki-logo.png" alt="Piłkarzyki" width={120} height={30} priority />
            <span className="text-gray-400">/</span>
            <span className="font-semibold text-gray-900 truncate">Transfery — {league.name}</span>
          </div>
          <Link
            href={`/leagues/${leagueId}/squad`}
            className="inline-flex items-center gap-1.5 shrink-0 min-h-[44px] px-3 rounded-xl text-sm font-medium text-[#29544D] hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
            Wróć do składu
          </Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 py-8">
        <MidseasonDraftClient leagueId={leagueId} />
      </main>
    </div>
  )
}
