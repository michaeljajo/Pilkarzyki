import { supabaseAdmin } from './supabase'
import { User, League, Player, Position } from '@/types'

// Database utility functions for seeding and testing

export class DatabaseUtils {
  static async createTestUser(userData: {
    clerkId: string
    email: string
    firstName?: string
    lastName?: string
    isAdmin?: boolean
  }): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: userData.clerkId,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        is_admin: userData.isAdmin || false
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`)
    }

    return {
      id: data.id,
      clerkId: data.clerk_id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      isAdmin: data.is_admin,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  static async createTestLeague(leagueData: {
    name: string
    adminId: string
    season: string
  }): Promise<League> {
    const { data, error } = await supabaseAdmin
      .from('leagues')
      .insert({
        name: leagueData.name,
        admin_id: leagueData.adminId,
        season: leagueData.season,
        current_gameweek: 1,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test league: ${error.message}`)
    }

    return {
      id: data.id,
      name: data.name,
      adminId: data.admin_id,
      currentGameweek: data.current_gameweek,
      season: data.season,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  static async seedTestPlayers(count: number = 20): Promise<Player[]> {
    const positions: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
    const leagues = ['Premier League', 'Championship', 'League One']

    const players = Array.from({ length: count }, (_, i) => ({
      name: `Player${i + 1}`,
      surname: `Test${i + 1}`,
      league: leagues[i % leagues.length],
      position: positions[i % positions.length],
      total_goals: Math.floor(Math.random() * 20)
    }))

    const { data, error } = await supabaseAdmin
      .from('players')
      .insert(players)
      .select()

    if (error) {
      throw new Error(`Failed to seed test players: ${error.message}`)
    }

    return data.map(player => ({
      id: player.id,
      name: player.name,
      surname: player.surname,
      league: player.league,
      position: player.position as Position,
      managerId: player.manager_id,
      totalGoals: player.total_goals,
      createdAt: new Date(player.created_at),
      updatedAt: new Date(player.updated_at)
    }))
  }

  static async checkConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1)

      return !error
    } catch {
      return false
    }
  }

  static async clearTestData(): Promise<void> {
    // Clear in reverse dependency order
    await supabaseAdmin.from('standings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('results').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('lineups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('gameweeks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('squad_players').delete().neq('squad_id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('squads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('leagues').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }

  static async getTableCounts(): Promise<Record<string, number>> {
    const tables = ['users', 'leagues', 'players', 'squads', 'gameweeks', 'lineups', 'matches', 'results', 'standings']
    const counts: Record<string, number> = {}

    for (const table of tables) {
      const { count } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true })

      counts[table] = count || 0
    }

    return counts
  }
}