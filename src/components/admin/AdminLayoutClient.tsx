'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { cn } from '@/utils/cn'
import { LeagueAdminNav } from './LeagueAdminNav'
import { LeagueAdminProvider, useLeagueAdmin } from '@/contexts/LeagueAdminContext'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

interface AdminLayoutClientProps {
  children: ReactNode
}

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()
  const { leagueId, leagueName } = useLeagueAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation — minimal in admin: logo, league scope, user menu */}
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

            {/* Center: League scope badge (states its scope) */}
            <div className="hidden md:flex items-center">
              {leagueName && (
                <span className="px-4 py-1.5 text-sm font-semibold text-[#29544D] bg-gray-100 rounded-full">
                  {leagueName}
                </span>
              )}
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
              // League-scoped navigation (the only admin navigation)
              <LeagueAdminNav leagueId={leagueId} leagueName={leagueName || undefined} onNavigate={closeSidebar} />
            ) : (
              // Outside a league (leagues index): just a way back to your leagues / the game
              <div className="px-2">
                <Link
                  href="/dashboard/admin/leagues"
                  onClick={closeSidebar}
                  className={cn(
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors',
                    pathname === '/dashboard/admin/leagues'
                      ? 'bg-[#29544D] text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-[#29544D]'
                  )}
                >
                  🏆 Moje ligi
                </Link>
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <Link
                    href="/dashboard"
                    onClick={closeSidebar}
                    className="group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors text-gray-700 hover:bg-gray-100 hover:text-[#29544D]"
                  >
                    Powrót do gry
                  </Link>
                </div>
              </div>
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
