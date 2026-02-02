'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Target, 
  BarChart3, 
  Settings, 
  Table, 
  Crosshair, 
  Crown, 
  MessageSquare, 
  Calendar, 
  Users 
} from 'lucide-react'

interface LeagueNavigationCardsProps {
  leagueId: string
  isManager: boolean
  isAdmin: boolean
  hasCup: boolean
}

// Style constants based on style guide
const COLORS = {
  richGreen: '#29544D',
  collegiateNavy: '#061852',
  sandGold: '#DECF99',
  sandGoldDark: '#B8A050',
  white: '#FFFFFF',
}

// Shared card styles
const cardBaseStyle: React.CSSProperties = {
  width: '160px',
  height: '140px',
  padding: '24px',
  backgroundColor: COLORS.white,
  border: `2px solid ${COLORS.richGreen}`,
  borderRadius: '16px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px',
  textAlign: 'center',
}

const mobileCardStyle: React.CSSProperties = {
  backgroundColor: COLORS.white,
  border: `2px solid ${COLORS.richGreen}`,
  borderRadius: '16px',
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  cursor: 'pointer',
}

const iconContainerStyle = (isCup: boolean): React.CSSProperties => ({
  width: '48px',
  height: '48px',
  minWidth: '48px',
  borderRadius: '12px',
  backgroundColor: isCup ? 'rgba(222, 207, 153, 0.2)' : 'rgba(41, 84, 77, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: COLORS.collegiateNavy,
  lineHeight: 1.3,
  margin: 0,
}

// Desktop Card Component
interface NavCardProps {
  href: string
  icon: React.ElementType
  label: string
  isCup?: boolean
}

function NavCard({ href, icon: Icon, label, isCup = false }: NavCardProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ 
          scale: 1.02,
          boxShadow: '0 10px 25px rgba(41, 84, 77, 0.15)'
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={cardBaseStyle}
      >
        <div style={iconContainerStyle(isCup)}>
          <Icon 
            size={24} 
            color={isCup ? COLORS.sandGoldDark : COLORS.richGreen}
            strokeWidth={2}
          />
        </div>
        <span style={labelStyle}>
          {label}
        </span>
      </motion.div>
    </Link>
  )
}

// Mobile Card Component
function MobileNavCard({ href, icon: Icon, label, isCup = false }: NavCardProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none', margin: '0 8px' }}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        style={mobileCardStyle}
      >
        <div style={iconContainerStyle(isCup)}>
          <Icon 
            size={24} 
            color={isCup ? COLORS.sandGoldDark : COLORS.richGreen}
            strokeWidth={2}
          />
        </div>
        <span style={labelStyle}>
          {label}
        </span>
      </motion.div>
    </Link>
  )
}

export function LeagueNavigationCards({ leagueId, isManager, isAdmin, hasCup }: LeagueNavigationCardsProps) {
  // Define all navigation items
  const navItems = [
    { id: 'squad', href: `/dashboard/leagues/${leagueId}/squad`, icon: Target, label: 'Wybierz drużynę', isCup: false, showIf: isManager },
    { id: 'results', href: `/dashboard/leagues/${leagueId}/results`, icon: BarChart3, label: 'Wyniki', isCup: false, showIf: true },
    { id: 'standings', href: `/dashboard/leagues/${leagueId}/standings`, icon: Table, label: 'Tabela', isCup: false, showIf: true },
    { id: 'schedule', href: `/dashboard/leagues/${leagueId}/schedule`, icon: Calendar, label: 'Terminarz', isCup: false, showIf: true },
    { id: 'scorers', href: `/dashboard/leagues/${leagueId}/top-scorers`, icon: Crosshair, label: 'Strzelcy', isCup: false, showIf: true },
    { id: 'squads', href: `/dashboard/leagues/${leagueId}/squads`, icon: Users, label: 'Składy', isCup: false, showIf: true },
    { id: 'cup-results', href: `/dashboard/leagues/${leagueId}/cup/results`, icon: Trophy, label: 'Wyniki Pucharu', isCup: true, showIf: hasCup },
    { id: 'cup-standings', href: `/dashboard/leagues/${leagueId}/cup/standings`, icon: Crown, label: 'Tabela Pucharu', isCup: true, showIf: hasCup },
    { id: 'tablica', href: `/dashboard/leagues/${leagueId}/tablica`, icon: MessageSquare, label: 'Tablica', isCup: false, showIf: true },
    { id: 'settings', href: `/dashboard/leagues/${leagueId}/settings`, icon: Settings, label: 'Ustawienia', isCup: false, showIf: isManager },
    { id: 'admin', href: `/dashboard/admin/leagues/${leagueId}/results`, icon: Settings, label: 'Zarządzaj Ligą', isCup: false, showIf: isAdmin },
  ]

  const visibleItems = navItems.filter(item => item.showIf)

  return (
    <>
      {/* Mobile: Compact List Layout */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
        className="md:hidden"
      >
        {visibleItems.map(item => (
          <MobileNavCard
            key={item.id}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isCup={item.isCup}
          />
        ))}
      </div>

      {/* Desktop: Card Grid Layout */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 160px)',
          gap: '24px',
          justifyContent: 'center',
          maxWidth: 'fit-content',
          margin: '0 auto',
        }}
        className="hidden md:grid"
      >
        {visibleItems.map(item => (
          <NavCard
            key={item.id}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isCup={item.isCup}
          />
        ))}
      </div>
    </>
  )
}
