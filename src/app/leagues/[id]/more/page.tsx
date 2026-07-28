import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { SignOutButton } from '@clerk/nextjs'
import { Settings, ArrowLeftRight, Wrench, LogOut, ChevronRight } from 'lucide-react'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'

interface MorePageProps {
  params: Promise<{ id: string }>
}

const rowClass =
  'flex items-center gap-3 w-full min-h-[52px] px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors'

export default async function MorePage({ params }: MorePageProps) {
  const { id: leagueId } = await params
  const { userId } = await auth()

  let isAdmin = false
  if (userId) {
    const res = await verifyLeagueAdmin(userId, leagueId)
    isAdmin = res.isAdmin
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Więcej</h1>

      <div className="flex flex-col gap-3">
        {isAdmin && (
          <Link href={`/leagues/${leagueId}/manage`} className={rowClass}>
            <Wrench size={20} style={{ color: '#29544D' }} />
            <span className="flex-1">Zarządzaj ligą</span>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
        )}

        <Link href={`/leagues/${leagueId}/settings`} className={rowClass}>
          <Settings size={20} style={{ color: '#29544D' }} />
          <span className="flex-1">Ustawienia</span>
          <ChevronRight size={18} className="text-gray-400" />
        </Link>

        <Link href="/leagues" className={rowClass}>
          <ArrowLeftRight size={20} style={{ color: '#29544D' }} />
          <span className="flex-1">Zmień ligę</span>
          <ChevronRight size={18} className="text-gray-400" />
        </Link>

        <SignOutButton redirectUrl="/">
          <button type="button" className={`${rowClass} text-left`}>
            <LogOut size={20} className="text-red-600" />
            <span className="flex-1">Wyloguj</span>
          </button>
        </SignOutButton>
      </div>
    </div>
  )
}
