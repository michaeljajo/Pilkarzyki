'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { cn } from '@/utils/cn'
import { LeagueAdminNav } from './LeagueAdminNav'
import { LeagueAdminProvider, useLeagueAdmin } from '@/contexts/LeagueAdminContext'
import Image from 'next/image'
import { Menu, X, ChevronDown } from 'lucide-react'

interface AdminLayoutClientProps {
  children: ReactNode
}

const adminNavItems = [
  { href: '/dashboard/admin/leagues', label: 'My Leagues', icon: '🏆' },
]

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()
  const { leagueId, leagueName } = useLeagueAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hasCup, setHasCup] = useState(false)
  const [loadingCup, setLoadingCup] = useState(true)

  const closeSidebar = () => setSidebarOpen(false)

  // Check if we're in the global admin area (not league-specific)
  const isGlobalAdmin = !leagueId

  // Check if league has a cup
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

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo and Hamburger */}
            <div className="flex items-center gap-3">
              {/* Hamburger Menu - Mobile Only */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>

              <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                <Image
                  src="/pilkarzyki-logo.png"
                  alt="Pilkarzyki"
                  width={200}
                  height={50}
                  priority
                />
              </Link>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                Admin
              </span>
            </div>

            {/* Center: Navigation Buttons (Desktop Only) */}
            <div className="hidden md:flex items-center gap-1">
              {isGlobalAdmin ? (
                // Global Admin Navigation
                <>
                  <Link
                    href="/dashboard/admin/leagues"
                    className={`min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center ${
                      pathname === '/dashboard/admin/leagues' || pathname.startsWith('/dashboard/admin/leagues/')
                        ? 'bg-[#061852] text-white shadow-sm hover:bg-[#0a2475] hover:shadow-md focus:ring-[#061852]'
                        : 'bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300'
                    }`}
                    style={{ paddingLeft: '2em', paddingRight: '2em' }}
                  >
                    Ligi
                  </Link>
                  <Link
                    href="/dashboard/admin/results"
                    className={`min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center ${
                      pathname === '/dashboard/admin/results'
                        ? 'bg-[#061852] text-white shadow-sm hover:bg-[#0a2475] hover:shadow-md focus:ring-[#061852]'
                        : 'bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300'
                    }`}
                    style={{ paddingLeft: '2em', paddingRight: '2em' }}
                  >
                    Wyniki
                  </Link>
                  <Link
                    href="/dashboard"
                    className="min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300"
                    style={{ paddingLeft: '2em', paddingRight: '2em' }}
                  >
                    &lt;-Powrót
                  </Link>
                </>
              ) : leagueId ? (
                // League-Specific Navigation
                <>
                  {/* Skład */}
                  <Link
                    href={`/dashboard/leagues/${leagueId}/squad`}
                    className="min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300"
                    style={{ paddingLeft: '2em', paddingRight: '2em' }}
                  >
                    Skład
                  </Link>

                  {/* Liga Dropdown */}
                  <div className="relative group">
                    <button
                      className="min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center gap-1 bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300"
                      style={{ paddingLeft: '2em', paddingRight: '2em' }}
                    >
                      Liga
                      <ChevronDown size={16} className="transition-transform group-hover:rotate-180 text-[#29544D]" />
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
                        className="min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center gap-1 bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300"
                        style={{ paddingLeft: '2em', paddingRight: '2em' }}
                      >
                        Puchar
                        <ChevronDown size={16} className="transition-transform group-hover:rotate-180 text-[#29544D]" />
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

                  {/* Terminarz */}
                  <Link
                    href={`/dashboard/leagues/${leagueId}/schedule`}
                    className="min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300"
                    style={{ paddingLeft: '2em', paddingRight: '2em' }}
                  >
                    Terminarz
                  </Link>

                  {/* Strzelcy */}
                  <Link
                    href={`/dashboard/leagues/${leagueId}/top-scorers`}
                    className="min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300"
                    style={{ paddingLeft: '2em', paddingRight: '2em' }}
                  >
                    Strzelcy
                  </Link>

                  {/* Admin */}
                  <Link
                    href={`/dashboard/admin/leagues/${leagueId}/results`}
                    className={`min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center ${
                      pathname.startsWith(`/dashboard/admin/leagues/${leagueId}`)
                        ? 'bg-[#061852] text-white shadow-sm hover:bg-[#0a2475] hover:shadow-md focus:ring-[#061852]'
                        : 'bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300'
                    }`}
                    style={{ paddingLeft: '2em', paddingRight: '2em' }}
                  >
                    Admin
                  </Link>

                  {/* <-Powrót */}
                  <Link
                    href={`/dashboard/leagues/${leagueId}`}
                    className="min-h-[44px] py-3 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap inline-flex items-center justify-center bg-transparent text-[#29544D] hover:bg-gray-100 focus:ring-gray-300"
                    style={{ paddingLeft: '2em', paddingRight: '2em' }}
                  >
                    &lt;-Powrót
                  </Link>
                </>
              ) : null}
            </div>

            {/* Right: User Profile */}
            <div className="flex items-center gap-4" suppressHydrationWarning>
              <span className="text-sm text-gray-600 hidden md:block">
                {user?.firstName} {user?.lastName}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex relative">
        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={cn(
            'fixed lg:sticky top-0 left-0 z-50 w-64 bg-gray-50 h-screen border-r border-gray-200 transition-transform duration-300 ease-in-out',
            'lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Close button - Mobile Only */}
          <div className="lg:hidden flex justify-end p-4">
            <button
              onClick={closeSidebar}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="mt-2 lg:mt-8 px-2">
            {leagueId ? (
              // League-specific navigation
              <LeagueAdminNav leagueId={leagueId} leagueName={leagueName || undefined} onNavigate={closeSidebar} />
            ) : (
              // Global admin navigation
              <>
                <div className="px-4 mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Administration
                  </h3>
                </div>
                <ul className="space-y-1 px-3">
                  {adminNavItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={closeSidebar}
                          className={cn(
                            'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            isActive
                              ? 'bg-[#29544D]/10 text-[#29544D] border-r-2 border-[#29544D]'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          )}
                        >
                          <span className="mr-3 text-lg">{item.icon}</span>
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>

                {/* Exit Admin Button - only shown in global admin view */}
                <div className="px-3 mt-8 pt-6 border-t border-gray-200">
                  <Link
                    href="/dashboard"
                    onClick={closeSidebar}
                    className="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full"
                  >
                    Powrót do gry
                  </Link>
                </div>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '32px', paddingBottom: '96px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  return (
    <LeagueAdminProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </LeagueAdminProvider>
  )
}