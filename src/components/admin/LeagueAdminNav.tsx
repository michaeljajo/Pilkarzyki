'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils/cn'
import { Users, Trophy, Calendar, ClipboardList, BarChart3, Settings, ArrowLeft, Award, Shirt } from 'lucide-react'

interface LeagueAdminNavProps {
  leagueId: string
  leagueName?: string
}

const getLeagueNavItems = (leagueId: string) => [
  {
    href: `/dashboard/admin/leagues/${leagueId}`,
    label: 'Przegląd',
    icon: Trophy,
    exactMatch: true
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/managers`,
    label: 'Menedżerowie',
    icon: Users
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/players`,
    label: 'Zawodnicy',
    icon: ClipboardList
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/gameweeks`,
    label: 'Kolejki',
    icon: Calendar
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/lineups`,
    label: 'Składy',
    icon: Shirt
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/cup`,
    label: 'Puchar',
    icon: Award
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/results`,
    label: 'Wyniki',
    icon: BarChart3
  },
  {
    href: `/dashboard/admin/leagues/${leagueId}/settings`,
    label: 'Ustawienia',
    icon: Settings
  },
]

export function LeagueAdminNav({ leagueId, leagueName }: LeagueAdminNavProps) {
  const pathname = usePathname()
  const navItems = getLeagueNavItems(leagueId)

  return (
    <div>
      {/* League Navigation */}
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exactMatch
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02]',
                  isActive
                    ? 'bg-[#29544D] text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#29544D]'
                )}
                style={{
                  padding: '12px 16px',
                  gap: '12px',
                  borderLeft: isActive ? '4px solid #1f3f3a' : '4px solid transparent'
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {isActive && <span className="ml-auto text-xs">●</span>}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Back to Game */}
      <div style={{ marginTop: '32px' }}>
        <Link
          href="/dashboard"
          className="group flex items-center text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] text-gray-700 hover:bg-gray-100 hover:text-[#29544D]"
          style={{
            padding: '12px 16px',
            gap: '12px',
            borderLeft: '4px solid transparent'
          }}
        >
          <ArrowLeft size={20} />
          <span>Powrót do gry</span>
        </Link>
      </div>
    </div>
  )
}
