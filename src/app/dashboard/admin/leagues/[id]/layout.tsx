import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { LeagueAdminContextSetter } from '@/components/admin/LeagueAdminContextSetter'

interface LeagueAdminLayoutProps {
  children: ReactNode
  params: { id: string }
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

export default async function LeagueAdminLayout({ children, params }: LeagueAdminLayoutProps) {
  const league = await getLeague(params.id)

  if (!league) {
    notFound()
  }

  return (
    <>
      <LeagueAdminContextSetter leagueId={league.id} leagueName={league.name} />
      {children}
    </>
  )
}
