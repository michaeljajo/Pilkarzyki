import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { AdminLineupsManager } from '@/components/admin/AdminLineupsManager'

export default async function AdminLineupsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const { id: leagueId } = await params

  // Get user's internal ID
  const { data: userRecord } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', user.id)
    .single()

  if (!userRecord) {
    redirect('/sign-in')
  }

  // Get league and verify admin access
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('*')
    .eq('id', leagueId)
    .single()

  if (!league || league.admin_id !== userRecord.id) {
    redirect('/dashboard')
  }

  // Get all gameweeks for this league
  const { data: gameweeks } = await supabaseAdmin
    .from('gameweeks')
    .select('*')
    .eq('league_id', leagueId)
    .order('week', { ascending: true })

  // Get all non-admin users (managers) - they should all be able to have lineups created
  const { data: allUsers } = await supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, email, is_admin')
    .eq('is_admin', false)
    .order('first_name', { ascending: true })

  const managers = allUsers?.map(user => ({
    id: user.id,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email
  })) || []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Zarządzanie Składami
        </h1>
        <p className="text-gray-600">
          Zarządzaj składami zawodników w imieniu menedżerów dla poszczególnych kolejek
        </p>
      </div>

      <AdminLineupsManager
        leagueId={leagueId}
        gameweeks={gameweeks || []}
        managers={managers}
      />
    </div>
  )
}
