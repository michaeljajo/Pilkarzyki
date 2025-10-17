'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { useUserRole } from '@/hooks/useUserRole'
import { cn } from '@/utils/cn'
import { LayoutDashboard, Users, Trophy, Target, ShirtIcon, Calendar, Medal } from 'lucide-react'
import Image from 'next/image'

interface AdminLayoutProps {
  children: ReactNode
}

const adminNavItems = [
  { href: '/dashboard/admin', label: 'Przegląd', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'Użytkownicy', icon: Users },
  { href: '/dashboard/admin/leagues', label: 'Ligi', icon: Trophy },
  { href: '/dashboard/admin/players', label: 'Zawodnicy', icon: Target },
  { href: '/dashboard/admin/squads', label: 'Drużyny', icon: ShirtIcon },
  { href: '/dashboard/admin/gameweeks', label: 'Kolejki', icon: Calendar },
  { href: '/dashboard/admin/table', label: 'Tabela', icon: Medal }
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const { isAdmin, loading, user, role } = useUserRole()

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('AdminLayout debug:', { isAdmin, loading, user: !!user, role })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#29544D] mx-auto mb-4"></div>
          <p className="text-gray-600">Sprawdzanie dostępu administratora...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-bold text-gray-900 mb-4" style={{ fontSize: '32px' }}>Odmowa dostępu</h1>
          <p className="text-gray-600 mb-2">Potrzebujesz uprawnień administratora, aby uzyskać dostęp do tego obszaru.</p>
          <p className="text-sm text-gray-500 mb-6">Obecna rola: {role || 'nieznana'}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              href="/dashboard"
              className="text-[#29544D] hover:text-[#1f3f3a]"
            >
              Powrót do Panelu
            </Link>
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400 mt-4">
                Debug: User ID: {user?.id || 'none'}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
          <div className="flex justify-between h-16">
            <div className="flex items-center" style={{ gap: '16px' }}>
              <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                <Image
                  src="/pilkarzyki-logo.png"
                  alt="Pilkarzyki"
                  width={200}
                  height={50}
                  priority
                />
              </Link>
              <div className="inline-flex items-center rounded-full bg-[#29544D] text-white text-xs font-bold" style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '4px', paddingBottom: '4px', gap: '6px' }}>
                <LayoutDashboard size={12} />
                Panel Administratora
              </div>
            </div>
            <div className="flex items-center" style={{ gap: '16px' }}>
              <div className="text-sm">
                <span className="text-gray-600">Zalogowany jako</span>
                <span className="font-semibold text-gray-900 ml-1">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <UserButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-72 bg-gray-50 border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <nav style={{ padding: '24px' }}>
            <div style={{ marginBottom: '32px' }}>
              <div className="flex items-center mb-2" style={{ gap: '12px' }}>
                <Trophy size={24} className="text-[#29544D]" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Zarządzanie Ligami
                </h3>
              </div>
              <p className="text-xs text-gray-600">
                Narzędzia i kontrolki administracyjne
              </p>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
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

            {/* Admin Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200" style={{ marginTop: '32px', padding: '16px' }}>
              <h4 className="text-sm font-semibold text-gray-900 flex items-center mb-3" style={{ gap: '8px' }}>
                <LayoutDashboard size={16} />
                Szybkie Statystyki
              </h4>
              <div className="text-xs" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Aktywne Ligi</span>
                  <span className="font-bold text-[#29544D]">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Użytkownicy</span>
                  <span className="font-bold text-[#061852]">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Kolejki</span>
                  <span className="font-bold text-[#14B8A6]">12</span>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto" style={{ padding: '32px' }}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
