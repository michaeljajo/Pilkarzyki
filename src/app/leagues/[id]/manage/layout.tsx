import { ReactNode } from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'
import { SecondaryNav } from '@/components/nav/SecondaryNav'

interface LeagueAdminLayoutProps {
  children: ReactNode
  params: Promise<{ id: string }>
}

/**
 * Layout for the per-league admin ("manage") area. Admin is a contextual mode,
 * not a separate app: it renders inside the same AppShell (header + tab bar,
 * with Więcej staying active) from the parent /leagues/[id] layout. This layout
 * adds the "Tryb administratora" banner and the admin secondary nav, and guards
 * the section server-side so non-admins never render it.
 */
export default async function LeagueAdminLayout({ children, params }: LeagueAdminLayoutProps) {
  const { id: leagueId } = await params

  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id')
    .eq('id', leagueId)
    .single()
  if (!league) notFound()

  // Guard: only league admins may enter. Non-admins are sent to Skład rather
  // than rendering the admin UI and hiding controls.
  const { isAdmin } = await verifyLeagueAdmin(userId, leagueId)
  if (!isAdmin) redirect(`/leagues/${leagueId}/squad`)

  const base = `/leagues/${leagueId}/manage`

  return (
    <div>
      {/* Admin-mode banner: persistent, directly under the header. */}
      <div className="mb-4 -mt-2 flex items-center justify-between gap-3 rounded-xl border border-[#061852]/20 bg-[#061852]/5 px-4 py-2.5">
        <span className="text-sm font-semibold" style={{ color: '#061852' }}>
          Tryb administratora
        </span>
        <Link
          href={`/leagues/${leagueId}/squad`}
          className="text-sm font-medium text-[#29544D] hover:underline"
        >
          Zakończ
        </Link>
      </div>

      <SecondaryNav
        ariaLabel="Sekcje administratora"
        items={[
          { label: 'Menedżerowie', href: `${base}/managers` },
          { label: 'Zawodnicy', href: `${base}/players` },
          { label: 'Terminarz', href: `${base}/gameweeks` },
          { label: 'Wyniki', href: `${base}/results` },
          { label: 'Puchar', href: `${base}/cup` },
          { label: 'Ustawienia', href: `${base}/settings` },
        ]}
      />

      {children}
    </div>
  )
}
