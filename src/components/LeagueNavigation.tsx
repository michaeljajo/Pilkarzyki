'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import { ArrowLeft, Menu, X, Target, BarChart3, Table, Trophy, Settings, Crosshair, ChevronDown, Calendar, Users, Crown, MessageSquare, Wrench } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface LeagueNavigationProps {
  leagueId: string
  leagueName: string
  currentPage: 'squad' | 'results' | 'standings' | 'schedule' | 'top-scorers' | 'cup-results' | 'cup-standings' | 'settings'
  showSquadTab?: boolean
}

// Style constants for consistency
const COLORS = {
  richGreen: '#29544D',
  collegiateNavy: '#061852',
  sandGoldDark: '#B8A050',
  white: '#FFFFFF',
}

const navigationTabs = [
  { id: 'squad', label: 'Skład', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/squad`, isCup: false },
  { id: 'results', label: 'Wyniki', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/results`, isCup: false },
  { id: 'standings', label: 'Tabela', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/standings`, isCup: false },
  { id: 'schedule', label: 'Terminarz', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/schedule`, isCup: false },
  { id: 'top-scorers', label: 'Strzelcy', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/top-scorers`, isCup: false },
  { id: 'cup-results', label: 'Wyniki Pucharu', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/cup/results`, isCup: true },
  { id: 'cup-standings', label: 'Tabela Pucharu', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/cup/standings`, isCup: true },
] as const

// Mobile menu card styles (inline to avoid Tailwind issues)
const mobileCardStyle = (isCup: boolean = false): React.CSSProperties => ({
  display: 'block',
  backgroundColor: COLORS.white,
  border: `2px solid ${COLORS.richGreen}`,
  borderRadius: '16px',
  padding: '16px',
  textDecoration: 'none',
  transition: 'box-shadow 200ms ease',
})

const mobileCardInnerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
}

const iconContainerStyle = (isCup: boolean): React.CSSProperties => ({
  width: '48px',
  height: '48px',
  flexShrink: 0,
  borderRadius: '12px',
  backgroundColor: isCup ? 'rgba(222, 207, 153, 0.2)' : 'rgba(41, 84, 77, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

const mobileLabelStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: COLORS.collegiateNavy,
  margin: 0,
}

// Helper to get icon for tab
function getIconForTab(tabId: string, isCup: boolean) {
  const color = isCup ? COLORS.sandGoldDark : COLORS.richGreen
  
  switch (tabId) {
    case 'squad': return <Target size={24} color={color} />
    case 'results': return <BarChart3 size={24} color={color} />
    case 'standings': return <Table size={24} color={color} />
    case 'schedule': return <Calendar size={24} color={color} />
    case 'top-scorers': return <Crosshair size={24} color={color} />
    case 'squads': return <Users size={24} color={color} />
    case 'cup-results': return <Trophy size={24} color={color} />
    case 'cup-standings': return <Crown size={24} color={color} />
    case 'tablica': return <MessageSquare size={24} color={color} />
    case 'settings': return <Settings size={24} color={color} />
    case 'admin': return <Wrench size={24} color={color} />
    default: return <Target size={24} color={color} />
  }
}

export function LeagueNavigation({
  leagueId,
  leagueName,
  currentPage,
  showSquadTab = true
}: LeagueNavigationProps) {
  const { user } = useUser()
  const [hasCup, setHasCup] = useState(false)
  const [loadingCup, setLoadingCup] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loadingAdmin, setLoadingAdmin] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function checkForCup() {
      if (!leagueId) {
        setLoadingCup(false)
        return
      }

      try {
        const response = await fetch(`/api/cups?leagueId=${leagueId}`)
        if (response.ok) {
          const data = await response.json()
          const cupExists = data.cup !== null && data.cup !== undefined
          setHasCup(cupExists)
        }
      } catch (error) {
        console.error('Failed to check for cup:', error)
      } finally {
        setLoadingCup(false)
      }
    }
    checkForCup()
  }, [leagueId])

  useEffect(() => {
    async function checkForAdmin() {
      if (!leagueId) {
        setLoadingAdmin(false)
        return
      }

      try {
        const response = await fetch(`/api/manager/leagues?id=${leagueId}&_t=${Date.now()}`, {
          cache: 'no-store'
        })
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.league?.user_is_admin || false)
        }
      } catch (error) {
        console.error('Failed to check admin status:', error)
      } finally {
        setLoadingAdmin(false)
      }
    }
    checkForAdmin()
  }, [leagueId])

  const filteredTabs = navigationTabs.filter(tab => {
    if (tab.id === 'squad' && !showSquadTab) return false
    if (tab.isCup && !hasCup) return false
    return true
  })

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <>
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo */}
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

            {/* Center: Navigation Tabs (Desktop Only) */}
            <div className="hidden md:flex items-center gap-1">
              {/* Skład */}
              {showSquadTab && (
                <Link
                  href={`/dashboard/leagues/${leagueId}/squad`}
                  className={`min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center ${
                    currentPage === 'squad'
                      ? 'bg-[#061852] text-white shadow-sm hover:bg-[#0a2475] hover:shadow-md focus:ring-[#061852]'
                      : 'bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300'
                  }`}
                  style={{ paddingLeft: '2em', paddingRight: '2em' }}
                >
                  Skład
                </Link>
              )}

              {/* Liga Dropdown */}
              <div className="relative group">
                <button
                  className={`min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center gap-1 ${
                    currentPage === 'results' || currentPage === 'standings'
                      ? 'bg-[#061852] text-white shadow-sm hover:bg-[#0a2475] hover:shadow-md focus:ring-[#061852]'
                      : 'bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300'
                  }`}
                  style={{ paddingLeft: '2em', paddingRight: '2em' }}
                >
                  Liga
                  <ChevronDown size={16} className={`transition-transform group-hover:rotate-180 ${
                    currentPage === 'results' || currentPage === 'standings'
                      ? 'text-white'
                      : 'text-[#29544D]'
                  }`} />
                </button>
                <div className="absolute left-0 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link
                    href={`/dashboard/leagues/${leagueId}/results`}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-xl transition-colors text-center"
                  >
                    Wyniki
                  </Link>
                  <Link
                    href={`/dashboard/leagues/${leagueId}/standings`}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-xl transition-colors text-center"
                  >
                    Tabela
                  </Link>
                </div>
              </div>

              {/* Terminarz */}
              <Link
                href={`/dashboard/leagues/${leagueId}/schedule`}
                className={`min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center ${
                  currentPage === 'schedule'
                    ? 'bg-[#061852] text-white shadow-sm hover:bg-[#0a2475] hover:shadow-md focus:ring-[#061852]'
                    : 'bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300'
                }`}
                style={{ paddingLeft: '2em', paddingRight: '2em' }}
              >
                Terminarz
              </Link>

              {/* Cup Dropdown - Only show if cup exists */}
              {hasCup && (
                <div className="relative group">
                  <button
                    className={`min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center gap-1 ${
                      currentPage === 'cup-results' || currentPage === 'cup-standings'
                        ? 'bg-[#061852] text-white shadow-sm hover:bg-[#0a2475] hover:shadow-md focus:ring-[#061852]'
                        : 'bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300'
                    }`}
                    style={{ paddingLeft: '2em', paddingRight: '2em' }}
                  >
                    Puchar
                    <ChevronDown size={16} className={`transition-transform group-hover:rotate-180 ${
                      currentPage === 'cup-results' || currentPage === 'cup-standings'
                        ? 'text-white'
                        : 'text-[#29544D]'
                    }`} />
                  </button>
                  <div className="absolute left-0 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link
                      href={`/dashboard/leagues/${leagueId}/cup/results`}
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-xl transition-colors text-center"
                    >
                      Wyniki
                    </Link>
                    <Link
                      href={`/dashboard/leagues/${leagueId}/cup/standings`}
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-xl transition-colors text-center"
                    >
                      Tabela
                    </Link>
                  </div>
                </div>
              )}

              {/* Strzelcy */}
              <Link
                href={`/dashboard/leagues/${leagueId}/top-scorers`}
                className={`min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center ${
                  currentPage === 'top-scorers'
                    ? 'bg-[#061852] text-white shadow-sm hover:bg-[#0a2475] hover:shadow-md focus:ring-[#061852]'
                    : 'bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300'
                }`}
                style={{ paddingLeft: '2em', paddingRight: '2em' }}
              >
                Strzelcy
              </Link>

              {/* Back Button */}
              <Link
                href={`/dashboard/leagues/${leagueId}`}
                className="min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300"
                style={{ paddingLeft: '2em', paddingRight: '2em' }}
              >
                &lt;-Powrót
              </Link>
            </div>

            {/* Right: User Profile (Desktop) / Hamburger Menu (Mobile) */}
            <div className="flex items-center gap-3">
              {/* Desktop: User Info */}
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-gray-700">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </span>
                <UserButton afterSignOutUrl="/" />
              </div>

              {/* Mobile: Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Mobile: User Button (always visible) */}
              <div className="md:hidden">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - UPDATED STYLING */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              top: '64px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40,
            }}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
            className="md:hidden"
          />

          {/* Slide-out Menu */}
          <div
            style={{
              position: 'fixed',
              top: '64px',
              right: 0,
              bottom: 0,
              width: '320px',
              backgroundColor: COLORS.white,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              zIndex: 50,
              overflowY: 'auto',
            }}
            className="md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Admin: Manage League */}
              {isAdmin && (
                <Link
                  href={`/dashboard/admin/leagues/${leagueId}/results`}
                  onClick={() => setMobileMenuOpen(false)}
                  style={mobileCardStyle(false)}
                >
                  <div style={mobileCardInnerStyle}>
                    <div style={iconContainerStyle(false)}>
                      <Wrench size={24} color={COLORS.richGreen} />
                    </div>
                    <span style={mobileLabelStyle}>Zarządzaj ligą</span>
                  </div>
                </Link>
              )}

              {/* Squad */}
              {showSquadTab && (
                <Link
                  href={`/dashboard/leagues/${leagueId}/squad`}
                  onClick={() => setMobileMenuOpen(false)}
                  style={mobileCardStyle(false)}
                >
                  <div style={mobileCardInnerStyle}>
                    <div style={iconContainerStyle(false)}>
                      {getIconForTab('squad', false)}
                    </div>
                    <span style={mobileLabelStyle}>Skład</span>
                  </div>
                </Link>
              )}

              {/* Results */}
              <Link
                href={`/dashboard/leagues/${leagueId}/results`}
                onClick={() => setMobileMenuOpen(false)}
                style={mobileCardStyle(false)}
              >
                <div style={mobileCardInnerStyle}>
                  <div style={iconContainerStyle(false)}>
                    {getIconForTab('results', false)}
                  </div>
                  <span style={mobileLabelStyle}>Wyniki</span>
                </div>
              </Link>

              {/* Standings */}
              <Link
                href={`/dashboard/leagues/${leagueId}/standings`}
                onClick={() => setMobileMenuOpen(false)}
                style={mobileCardStyle(false)}
              >
                <div style={mobileCardInnerStyle}>
                  <div style={iconContainerStyle(false)}>
                    {getIconForTab('standings', false)}
                  </div>
                  <span style={mobileLabelStyle}>Tabela</span>
                </div>
              </Link>

              {/* Schedule */}
              <Link
                href={`/dashboard/leagues/${leagueId}/schedule`}
                onClick={() => setMobileMenuOpen(false)}
                style={mobileCardStyle(false)}
              >
                <div style={mobileCardInnerStyle}>
                  <div style={iconContainerStyle(false)}>
                    {getIconForTab('schedule', false)}
                  </div>
                  <span style={mobileLabelStyle}>Terminarz</span>
                </div>
              </Link>

              {/* Cup Results */}
              {hasCup && (
                <Link
                  href={`/dashboard/leagues/${leagueId}/cup/results`}
                  onClick={() => setMobileMenuOpen(false)}
                  style={mobileCardStyle(true)}
                >
                  <div style={mobileCardInnerStyle}>
                    <div style={iconContainerStyle(true)}>
                      {getIconForTab('cup-results', true)}
                    </div>
                    <span style={mobileLabelStyle}>Wyniki Pucharu</span>
                  </div>
                </Link>
              )}

              {/* Cup Standings */}
              {hasCup && (
                <Link
                  href={`/dashboard/leagues/${leagueId}/cup/standings`}
                  onClick={() => setMobileMenuOpen(false)}
                  style={mobileCardStyle(true)}
                >
                  <div style={mobileCardInnerStyle}>
                    <div style={iconContainerStyle(true)}>
                      {getIconForTab('cup-standings', true)}
                    </div>
                    <span style={mobileLabelStyle}>Tabela Pucharu</span>
                  </div>
                </Link>
              )}

              {/* Top Scorers */}
              <Link
                href={`/dashboard/leagues/${leagueId}/top-scorers`}
                onClick={() => setMobileMenuOpen(false)}
                style={mobileCardStyle(false)}
              >
                <div style={mobileCardInnerStyle}>
                  <div style={iconContainerStyle(false)}>
                    {getIconForTab('top-scorers', false)}
                  </div>
                  <span style={mobileLabelStyle}>Strzelcy</span>
                </div>
              </Link>

              {/* Squads (Składy) - for admins */}
              {isAdmin && (
                <Link
                  href={`/dashboard/admin/leagues/${leagueId}/lineups`}
                  onClick={() => setMobileMenuOpen(false)}
                  style={mobileCardStyle(false)}
                >
                  <div style={mobileCardInnerStyle}>
                    <div style={iconContainerStyle(false)}>
                      {getIconForTab('squads', false)}
                    </div>
                    <span style={mobileLabelStyle}>Składy</span>
                  </div>
                </Link>
              )}

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '8px 0' }} />

              {/* Back Button */}
              <Link
                href={`/dashboard/leagues/${leagueId}`}
                onClick={() => setMobileMenuOpen(false)}
                style={mobileCardStyle(false)}
              >
                <div style={mobileCardInnerStyle}>
                  <div style={{
                    ...iconContainerStyle(false),
                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                  }}>
                    <ArrowLeft size={24} color="#6b7280" />
                  </div>
                  <span style={mobileLabelStyle}>← Powrót</span>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}
