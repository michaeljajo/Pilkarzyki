import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import { APP_CONTAINER } from '@/components/layout/appContainer'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import { DraftClient } from './DraftClient'

interface DraftPageProps {
  params: Promise<{ id: string }>
}

export default async function DraftPage({ params }: DraftPageProps) {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const { id: leagueId } = await params

  const { data: userRecord } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', user.id)
    .single()

  if (!userRecord) {
    redirect('/sign-in')
  }

  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name, is_active')
    .eq('id', leagueId)
    .single()

  if (!league) {
    redirect('/leagues')
  }

  // The draft is a season-setup activity — archived (read-only) leagues have no
  // draft screen.
  if (league.is_active === false) {
    redirect(`/leagues/${leagueId}`)
  }

  const { isAdmin } = await verifyLeagueAdmin(user.id, leagueId)

  const { data: squad } = await supabaseAdmin
    .from('squads')
    .select('id')
    .eq('league_id', leagueId)
    .eq('manager_id', userRecord.id)
    .maybeSingle()

  const isManager = !!squad

  // Must be admin or a manager in this league.
  if (!isAdmin && !isManager) {
    redirect('/leagues')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Takeover header: full-screen, no tab bar, with a single explicit exit. */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className={`${APP_CONTAINER} h-16 flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-2 min-w-0">
            <Image src="/pilkarzyki-logo.png" alt="Piłkarzyki" width={120} height={30} priority />
            <span className="text-gray-400">/</span>
            <span className="font-semibold text-gray-900 truncate">Draft — {league.name}</span>
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

      {/* Phone: 1rem above, none below — the board is sized to exactly one
          viewport (see DraftLiveBoard) and ends in its own tab bar, which
          must meet the bottom edge. The height budget there assumes this
          pt-4 and the h-16 header above. */}
      <main className={`${APP_CONTAINER} pt-4 pb-0 md:py-8`}>
        <DraftClient leagueId={leagueId} />
      </main>
    </div>
  )
}
