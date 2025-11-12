import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Sheet 1: Managers_Mapping (NEW - must be first)
    const managersMappingData = [
      { 'Team Name': 'Team A', Manager: 'manager1@example.com' },
      { 'Team Name': 'Team B', Manager: 'manager2@example.com' },
      { 'Team Name': 'Team C', Manager: 'manager3@example.com' },
      { 'Team Name': 'Team D', Manager: 'manager4@example.com' }
    ]
    const ws0 = XLSX.utils.json_to_sheet(managersMappingData)
    ws0['!cols'] = [
      { width: 25 }, // Team Name
      { width: 30 }  // Manager
    ]
    XLSX.utils.book_append_sheet(workbook, ws0, 'Managers_Mapping')

    // Sheet 2: League_Gameweeks (with new time fields)
    const leagueGameweeksData = [
      { Week: 1, StartDate: '2024-08-10', EndDate: '2024-08-11', LockDate: '2024-08-11', LockTime: '23:59:00', CompletionDate: '2024-08-11', CompletionTime: '23:59:00', IsCompleted: 'TRUE' },
      { Week: 2, StartDate: '2024-08-17', EndDate: '2024-08-18', LockDate: '2024-08-18', LockTime: '23:59:00', CompletionDate: '2024-08-18', CompletionTime: '23:59:00', IsCompleted: 'TRUE' },
      { Week: 3, StartDate: '2024-08-24', EndDate: '2024-08-25', LockDate: '2024-08-25', LockTime: '23:59:00', CompletionDate: '', CompletionTime: '', IsCompleted: 'FALSE' },
      { Week: 4, StartDate: '2024-08-31', EndDate: '2024-09-01', LockDate: '2024-09-01', LockTime: '23:59:00', CompletionDate: '', CompletionTime: '', IsCompleted: 'FALSE' }
    ]
    const ws1 = XLSX.utils.json_to_sheet(leagueGameweeksData)
    ws1['!cols'] = [
      { width: 8 },  // Week
      { width: 12 }, // StartDate
      { width: 12 }, // EndDate
      { width: 12 }, // LockDate
      { width: 12 }, // LockTime
      { width: 15 }, // CompletionDate
      { width: 15 }, // CompletionTime
      { width: 12 }  // IsCompleted
    ]
    XLSX.utils.book_append_sheet(workbook, ws1, 'League_Gameweeks')

    // Sheet 3: League_Fixtures_And_Results (using team names)
    const leagueFixturesData = [
      {
        Gameweek: 1,
        HomeTeam: 'Team A',
        AwayTeam: 'Team B',
        HomePlayer1: 'Lionel Messi',
        HomePlayer1Goals: 2,
        HomePlayer2: 'Virgil van Dijk',
        HomePlayer2Goals: 0,
        HomePlayer3: 'Luka Modric',
        HomePlayer3Goals: 1,
        AwayPlayer1: 'Cristiano Ronaldo',
        AwayPlayer1Goals: 1,
        AwayPlayer2: 'Kevin De Bruyne',
        AwayPlayer2Goals: 1,
        AwayPlayer3: 'Harry Kane',
        AwayPlayer3Goals: 0,
        IsCompleted: 'TRUE'
      },
      {
        Gameweek: 2,
        HomeTeam: 'Team C',
        AwayTeam: 'Team D',
        HomePlayer1: '',
        HomePlayer1Goals: '',
        HomePlayer2: '',
        HomePlayer2Goals: '',
        HomePlayer3: '',
        HomePlayer3Goals: '',
        AwayPlayer1: '',
        AwayPlayer1Goals: '',
        AwayPlayer2: '',
        AwayPlayer2Goals: '',
        AwayPlayer3: '',
        AwayPlayer3Goals: '',
        IsCompleted: 'FALSE'
      }
    ]
    const ws2 = XLSX.utils.json_to_sheet(leagueFixturesData)
    ws2['!cols'] = [
      { width: 10 }, // Gameweek
      { width: 25 }, // HomeManager
      { width: 25 }, // AwayManager
      { width: 20 }, // HomePlayer1
      { width: 15 }, // HomePlayer1Goals
      { width: 20 }, // HomePlayer2
      { width: 15 }, // HomePlayer2Goals
      { width: 20 }, // HomePlayer3
      { width: 15 }, // HomePlayer3Goals
      { width: 20 }, // AwayPlayer1
      { width: 15 }, // AwayPlayer1Goals
      { width: 20 }, // AwayPlayer2
      { width: 15 }, // AwayPlayer2Goals
      { width: 20 }, // AwayPlayer3
      { width: 15 }, // AwayPlayer3Goals
      { width: 12 }  // IsCompleted
    ]
    XLSX.utils.book_append_sheet(workbook, ws2, 'League_Fixtures_And_Results')

    // Sheet 4: Cup_Groups (using team names)
    const cupGroupsData = [
      { GroupName: 'A', 'Team Name': 'Team A' },
      { GroupName: 'A', 'Team Name': 'Team B' },
      { GroupName: 'A', 'Team Name': 'Team C' },
      { GroupName: 'A', 'Team Name': 'Team D' },
      { GroupName: 'B', 'Team Name': 'Team E' },
      { GroupName: 'B', 'Team Name': 'Team F' },
      { GroupName: 'B', 'Team Name': 'Team G' },
      { GroupName: 'B', 'Team Name': 'Team H' }
    ]
    const ws3 = XLSX.utils.json_to_sheet(cupGroupsData)
    ws3['!cols'] = [
      { width: 12 }, // GroupName
      { width: 25 }  // Team Name
    ]
    XLSX.utils.book_append_sheet(workbook, ws3, 'Cup_Groups')

    // Sheet 4: Cup_Gameweeks
    const cupGameweeksData = [
      { CupWeek: 1, LeagueGameweek: 1, Stage: 'group_stage', Leg: 1 },
      { CupWeek: 2, LeagueGameweek: 3, Stage: 'group_stage', Leg: 1 },
      { CupWeek: 3, LeagueGameweek: 5, Stage: 'group_stage', Leg: 1 },
      { CupWeek: 4, LeagueGameweek: 7, Stage: 'group_stage', Leg: 1 },
      { CupWeek: 5, LeagueGameweek: 9, Stage: 'group_stage', Leg: 1 },
      { CupWeek: 6, LeagueGameweek: 11, Stage: 'group_stage', Leg: 1 },
      { CupWeek: 7, LeagueGameweek: 13, Stage: 'round_of_16', Leg: 1 },
      { CupWeek: 8, LeagueGameweek: 15, Stage: 'round_of_16', Leg: 2 },
      { CupWeek: 9, LeagueGameweek: 17, Stage: 'quarter_final', Leg: 1 },
      { CupWeek: 10, LeagueGameweek: 19, Stage: 'quarter_final', Leg: 2 },
      { CupWeek: 11, LeagueGameweek: 21, Stage: 'semi_final', Leg: 1 },
      { CupWeek: 12, LeagueGameweek: 23, Stage: 'semi_final', Leg: 2 },
      { CupWeek: 13, LeagueGameweek: 25, Stage: 'final', Leg: 1 }
    ]
    const ws4 = XLSX.utils.json_to_sheet(cupGameweeksData)
    ws4['!cols'] = [
      { width: 10 }, // CupWeek
      { width: 15 }, // LeagueGameweek
      { width: 18 }, // Stage
      { width: 8 }   // Leg
    ]
    XLSX.utils.book_append_sheet(workbook, ws4, 'Cup_Gameweeks')

    // Sheet 6: Cup_Fixtures_And_Results (using team names)
    const cupFixturesData = [
      {
        CupGameweek: 1,
        Stage: 'group_stage',
        Leg: 1,
        GroupName: 'A',
        HomeTeam: 'Team A',
        AwayTeam: 'Team B',
        HomePlayer1: 'Lionel Messi',
        HomePlayer1Goals: 1,
        HomePlayer2: 'Virgil van Dijk',
        HomePlayer2Goals: 0,
        HomePlayer3: 'Luka Modric',
        HomePlayer3Goals: 1,
        AwayPlayer1: 'Cristiano Ronaldo',
        AwayPlayer1Goals: 2,
        AwayPlayer2: 'Kevin De Bruyne',
        AwayPlayer2Goals: 0,
        AwayPlayer3: 'Harry Kane',
        AwayPlayer3Goals: 1,
        IsCompleted: 'TRUE'
      },
      {
        CupGameweek: 2,
        Stage: 'group_stage',
        Leg: 1,
        GroupName: 'A',
        HomeTeam: 'Team C',
        AwayTeam: 'Team D',
        HomePlayer1: '',
        HomePlayer1Goals: '',
        HomePlayer2: '',
        HomePlayer2Goals: '',
        HomePlayer3: '',
        HomePlayer3Goals: '',
        AwayPlayer1: '',
        AwayPlayer1Goals: '',
        AwayPlayer2: '',
        AwayPlayer2Goals: '',
        AwayPlayer3: '',
        AwayPlayer3Goals: '',
        IsCompleted: 'FALSE'
      },
      {
        CupGameweek: 7,
        Stage: 'round_of_16',
        Leg: 1,
        GroupName: '',
        HomeTeam: '',
        AwayTeam: '',
        HomePlayer1: '',
        HomePlayer1Goals: '',
        HomePlayer2: '',
        HomePlayer2Goals: '',
        HomePlayer3: '',
        HomePlayer3Goals: '',
        AwayPlayer1: '',
        AwayPlayer1Goals: '',
        AwayPlayer2: '',
        AwayPlayer2Goals: '',
        AwayPlayer3: '',
        AwayPlayer3Goals: '',
        IsCompleted: 'FALSE'
      }
    ]
    const ws5 = XLSX.utils.json_to_sheet(cupFixturesData)
    ws5['!cols'] = [
      { width: 12 }, // CupGameweek
      { width: 15 }, // Stage
      { width: 8 },  // Leg
      { width: 12 }, // GroupName
      { width: 25 }, // HomeManager
      { width: 25 }, // AwayManager
      { width: 20 }, // HomePlayer1
      { width: 15 }, // HomePlayer1Goals
      { width: 20 }, // HomePlayer2
      { width: 15 }, // HomePlayer2Goals
      { width: 20 }, // HomePlayer3
      { width: 15 }, // HomePlayer3Goals
      { width: 20 }, // AwayPlayer1
      { width: 15 }, // AwayPlayer1Goals
      { width: 20 }, // AwayPlayer2
      { width: 15 }, // AwayPlayer2Goals
      { width: 20 }, // AwayPlayer3
      { width: 15 }, // AwayPlayer3Goals
      { width: 12 }  // IsCompleted
    ]
    XLSX.utils.book_append_sheet(workbook, ws5, 'Cup_Fixtures_And_Results')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="migration-template.xlsx"'
      }
    })

  } catch (error) {
    console.error('Template download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
