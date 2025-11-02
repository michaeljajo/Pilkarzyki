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

  // Get all managers with squads in this league
  const { data: squads } = await supabaseAdmin
    .from('squads')
    .select(`
      manager_id,
      users!inner (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('league_id', leagueId)

  // Type assertion for Supabase joined data
  type SquadWithUser = {
    manager_id: string;
    users: Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    }>;
  };

  const managers = ((squads || []) as SquadWithUser[]).map(squad => ({
    id: squad.users[0].id,
    firstName: squad.users[0].first_name || '',
    lastName: squad.users[0].last_name || '',
    email: squad.users[0].email
  }))

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
