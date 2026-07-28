import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

interface LeagueAdminLayoutProps {
  children: ReactNode
  params: Promise<{ id: string }>
}

async function getLeague(id: string) {
  try {
    const { data: league, error } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .eq('id', id)
      .single()

    if (error || !league) {
      return null
    }

    return league
  } catch (error) {
    console.error('Error fetching league:', error)
    return null
  }
}

/**
 * Layout for the per-league admin ("manage") area. The unified navigation
 * (header + tab bar + the admin secondary nav and "Tryb administratora" banner)
 * is provided by the AppShell in the parent /leagues/[id] layout, so this
 * layout only validates that the league exists.
 */
export default async function LeagueAdminLayout({ children, params }: LeagueAdminLayoutProps) {
  const resolvedParams = await params
  const league = await getLeague(resolvedParams.id)

  if (!league) {
    notFound()
  }

  return <>{children}</>
}
