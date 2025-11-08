'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import { ArrowLeft, Menu, X, Target, BarChart3, Table, Trophy, Settings, Award, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface LeagueNavigationProps {
  leagueId: string
  leagueName: string
  currentPage: 'squad' | 'results' | 'standings' | 'top-scorers' | 'cup-results' | 'cup-standings'
  showSquadTab?: boolean // Some leagues might not have squad access for certain users
}

const navigationTabs = [
  { id: 'squad', label: 'Skład', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/squad`, isCup: false },
  { id: 'results', label: 'Wyniki', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/results`, isCup: false },
  { id: 'standings', label: 'Tabela', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/standings`, isCup: false },
  { id: 'top-scorers', label: 'Strzelcy', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/top-scorers`, isCup: false },
  { id: 'cup-results', label: '🏆 Wyniki Pucharu', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/cup/results`, isCup: true },
  { id: 'cup-standings', label: '🏆 Tabela Pucharu', href: (leagueId: string) => `/dashboard/leagues/${leagueId}/cup/standings`, isCup: true },
] as const

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
    // Check if league has a cup
    async function checkForCup() {
      // Don't fetch if leagueId is not available yet
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
    // Check if user is admin of this league
    async function checkForAdmin() {
      // Don't fetch if leagueId is not available yet
      if (!leagueId) {
        setLoadingAdmin(false)
        return
      }

      try {
        const response = await fetch(`/api/manager/leagues?id=${leagueId}`)
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

  // Filter tabs based on squad visibility and cup existence
  const filteredTabs = navigationTabs.filter(tab => {
    if (tab.id === 'squad' && !showSquadTab) return false
    if (tab.isCup && !hasCup) return false
    return true
  })

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
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

              {/* Puchar Dropdown */}
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

              {/* Admin */}
              {isAdmin && (
                <Link
                  href={`/dashboard/admin/leagues/${leagueId}`}
                  className="min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300"
                  style={{ paddingLeft: '2em', paddingRight: '2em' }}
                >
                  Admin
                </Link>
              )}

              {/* <-Powrót */}
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Menu */}
          <div
            className="fixed top-16 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 md:hidden overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="p-4 space-y-3">
              {/* Navigation Links */}
              <nav className="space-y-3">
                {filteredTabs.map((tab) => {
                  const isActive = tab.id === currentPage
                  const isCupTab = tab.isCup

                  // Determine colors based on tab type
                  const bgColor = isCupTab
                    ? 'bg-amber-600/10'
                    : tab.id === 'squad'
                      ? 'bg-[#29544D]/10'
                      : tab.id === 'results'
                        ? 'bg-[#3B82F6]/10'
                        : tab.id === 'top-scorers'
                          ? 'bg-[#F59E0B]/10'
                          : 'bg-[#10B981]/10'

                  const iconColor = isCupTab
                    ? 'text-amber-600'
                    : tab.id === 'squad'
                      ? 'text-[#29544D]'
                      : tab.id === 'results'
                        ? 'text-[#3B82F6]'
                        : tab.id === 'top-scorers'
                          ? 'text-[#F59E0B]'
                          : 'text-[#10B981]'

                  const borderColor = isCupTab ? 'border-amber-200' : 'border-gray-200'

                  return (
                    <Link
                      key={tab.id}
                      href={tab.href(leagueId)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block rounded-xl border-2 ${isActive ? borderColor + ' shadow-md' : 'border-gray-200'} hover:shadow-lg transition-shadow duration-200 p-4`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 shrink-0 rounded-lg ${bgColor} flex items-center justify-center`}>
                          {tab.id === 'squad' && <Target size={24} className={iconColor} />}
                          {tab.id === 'results' && <BarChart3 size={24} className={iconColor} />}
                          {tab.id === 'standings' && <Table size={24} className={iconColor} />}
                          {tab.id === 'top-scorers' && <Award size={24} className={iconColor} />}
                          {tab.isCup && <Trophy size={24} className={iconColor} />}
                        </div>
                        <h3 className="text-base font-bold text-gray-900">{tab.label}</h3>
                      </div>
                    </Link>
                  )
                })}

                {/* Admin: Manage League Link */}
                {isAdmin && (
                  <Link
                    href={`/dashboard/admin/leagues/${leagueId}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl border-2 border-gray-200 hover:shadow-lg transition-shadow duration-200 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                        <Settings size={24} className="text-[#F59E0B]" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Admin</h3>
                    </div>
                  </Link>
                )}
              </nav>

              {/* Back Button */}
              <div className="pt-3 border-t border-gray-200">
                <Link
                  href={`/dashboard/leagues/${leagueId}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl border-2 border-gray-200 hover:shadow-lg transition-shadow duration-200 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ArrowLeft size={24} className="text-gray-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">&lt;-Powrót</h3>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
