'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils/cn'
import {
  Users,
  Calendar,
  ClipboardList,
  Settings,
  ArrowLeft,
  Award,
  Shirt,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'

interface LeagueAdminNavProps {
  leagueId: string
  leagueName?: string
  onNavigate?: () => void
}

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  exactMatch?: boolean
}

// Two-zone structure: the weekly rhythm (Panel, Kolejka) on top,
// rarely-touched setup grouped under "Konfiguracja".
const getPrimaryNavItems = (leagueId: string): NavItem[] => [
  {
    href: `/leagues/${leagueId}/manage`,
    label: 'Panel',
    icon: LayoutDashboard,
    exactMatch: true,
  },
  {
    href: `/leagues/${leagueId}/manage/results`,
    label: 'Kolejka',
    icon: ClipboardList,
  },
]

const getConfigNavItems = (leagueId: string): NavItem[] => [
  {
    href: `/leagues/${leagueId}/manage/managers`,
    label: 'Menedżerowie',
    icon: Users,
  },
  {
    href: `/leagues/${leagueId}/manage/players`,
    label: 'Zawodnicy',
    icon: Shirt,
  },
  {
    href: `/leagues/${leagueId}/manage/gameweeks`,
    label: 'Terminarz',
    icon: Calendar,
  },
  {
    href: `/leagues/${leagueId}/manage/cup`,
    label: 'Puchar',
    icon: Award,
  },
  {
    href: `/leagues/${leagueId}/manage/settings`,
    label: 'Ustawienia',
    icon: Settings,
  },
]

export function LeagueAdminNav({ leagueId, onNavigate }: LeagueAdminNavProps) {
  const pathname = usePathname()
  const primaryItems = getPrimaryNavItems(leagueId)
  const configItems = getConfigNavItems(leagueId)

  const renderItem = (item: NavItem) => {
    const Icon = item.icon
    const isActive = item.exactMatch
      ? pathname === item.href
      : pathname.startsWith(item.href)

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onNavigate}
          className={cn(
            'group flex items-center text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02]',
            isActive
              ? 'bg-[#29544D] text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100 hover:text-[#29544D]'
          )}
          style={{
            padding: '12px 16px',
            gap: '12px',
            borderLeft: isActive ? '4px solid #1f3f3a' : '4px solid transparent',
          }}
        >
          <Icon size={20} />
          <span>{item.label}</span>
          {isActive && <span className="ml-auto text-xs">●</span>}
        </Link>
      </li>
    )
  }

  return (
    <div>
      {/* Primary: weekly rhythm */}
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {primaryItems.map(renderItem)}
      </ul>

      {/* Konfiguracja group */}
      <div style={{ marginTop: '24px' }}>
        <h3 className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Konfiguracja
        </h3>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {configItems.map(renderItem)}
        </ul>
      </div>

      {/* Back to Game — single, consistent destination */}
      <div style={{ marginTop: '32px' }}>
        <Link
          href={`/leagues/${leagueId}`}
          onClick={onNavigate}
          className="group flex items-center text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] text-gray-700 hover:bg-gray-100 hover:text-[#29544D]"
          style={{
            padding: '12px 16px',
            gap: '12px',
            borderLeft: '4px solid transparent',
          }}
        >
          <ArrowLeft size={20} />
          <span>Powrót do gry</span>
        </Link>
      </div>
    </div>
  )
}
