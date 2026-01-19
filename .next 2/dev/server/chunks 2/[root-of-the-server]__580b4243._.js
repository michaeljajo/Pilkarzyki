module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/supabase.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase,
    "supabaseAdmin",
    ()=>supabaseAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://vlazwgdlylqvbsvpmoot.supabase.co");
const supabaseKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsYXp3Z2RseWxxdmJzdnBtb290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwOTc4NTksImV4cCI6MjA3MzY3Mzg1OX0.g7xoEXl5Wm7X6zX3JK1AcxrhDs4NbqNZRkFtNu85gLk");
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseKey);
const supabaseAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
}),
"[project]/src/utils/standings-calculator.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateLeagueStandings",
    ()=>calculateLeagueStandings,
    "recalculateCupGroupStandings",
    ()=>recalculateCupGroupStandings,
    "recalculateLeagueStandings",
    ()=>recalculateLeagueStandings,
    "updateStandingsTable",
    ()=>updateStandingsTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
;
async function calculateLeagueStandings(leagueId) {
    // Get all completed matches for the league
    const { data: matches, error: matchError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('matches').select(`
      id,
      home_manager_id,
      away_manager_id,
      home_score,
      away_score,
      is_completed
    `).eq('league_id', leagueId).eq('is_completed', true);
    if (matchError) {
        throw new Error(`Failed to fetch matches: ${matchError.message}`);
    }
    // Get all managers in the league
    const { data: managers, error: managerError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select(`
      id,
      first_name,
      last_name,
      email,
      squads!inner(league_id)
    `).eq('squads.league_id', leagueId);
    if (managerError) {
        throw new Error(`Failed to fetch managers: ${managerError.message}`);
    }
    // Fetch team names for all managers in this league
    const managerIds = managers?.map((m)=>m.id) || [];
    const { data: squads } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('manager_id, team_name').eq('league_id', leagueId).in('manager_id', managerIds);
    const squadMap = new Map(squads?.map((s)=>[
            s.manager_id,
            s
        ]) || []);
    // Fetch manual tiebreakers for this league
    const { data: manualTiebreakers } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('manual_tiebreakers').select('manager_id, tiebreaker_value').eq('league_id', leagueId).in('manager_id', managerIds);
    const tiebreakerMap = new Map(manualTiebreakers?.map((t)=>[
            t.manager_id,
            t.tiebreaker_value
        ]) || []);
    // Initialize stats for all managers
    const managerStats = {};
    managers?.forEach((manager)=>{
        const managerName = `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || 'Unknown';
        const squad = squadMap.get(manager.id);
        managerStats[manager.id] = {
            managerId: manager.id,
            managerName,
            teamName: squad?.team_name || null,
            email: manager.email,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            manualTiebreaker: tiebreakerMap.get(manager.id) || null
        };
    });
    // Process all matches to calculate stats
    matches?.forEach((match)=>{
        if (match.home_score !== null && match.away_score !== null) {
            const homeStats = managerStats[match.home_manager_id];
            const awayStats = managerStats[match.away_manager_id];
            if (homeStats && awayStats) {
                // Update games played
                homeStats.played++;
                awayStats.played++;
                // Update goals
                homeStats.goalsFor += match.home_score;
                homeStats.goalsAgainst += match.away_score;
                awayStats.goalsFor += match.away_score;
                awayStats.goalsAgainst += match.home_score;
                // Determine result and update points/record
                if (match.home_score > match.away_score) {
                    // Home win
                    homeStats.won++;
                    homeStats.points += 3;
                    awayStats.lost++;
                } else if (match.away_score > match.home_score) {
                    // Away win
                    awayStats.won++;
                    awayStats.points += 3;
                    homeStats.lost++;
                } else {
                    // Draw
                    homeStats.drawn++;
                    awayStats.drawn++;
                    homeStats.points += 1;
                    awayStats.points += 1;
                }
            }
        }
    });
    // Calculate goal difference
    Object.values(managerStats).forEach((stats)=>{
        stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
    });
    // Convert to array for sorting
    const standings = Object.values(managerStats);
    // Sort with custom tiebreaker rules
    return sortStandingsWithTiebreakers(standings, matches || []);
}
/**
 * Sort standings with custom league tiebreaker rules
 * 1. Points (higher is better)
 * 2. Goals Scored (higher is better)
 * 3. Goals Conceded (higher is better - unlucky teams rank higher)
 * 4. Head-to-Head Record (when teams are tied on points)
 * 5. Manual Tiebreaker (admin-set, lower value = higher rank)
 * 6. Alphabetical (final fallback)
 */ function sortStandingsWithTiebreakers(standings, matches) {
    return standings.sort((a, b)=>{
        // 1. Points (descending)
        if (a.points !== b.points) {
            return b.points - a.points;
        }
        // 2. Goals Scored (descending)
        if (a.goalsFor !== b.goalsFor) {
            return b.goalsFor - a.goalsFor;
        }
        // 3. Goals Conceded (descending - more conceded = higher rank)
        if (a.goalsAgainst !== b.goalsAgainst) {
            return b.goalsAgainst - a.goalsAgainst;
        }
        // 4. Head-to-Head Record (when tied on points)
        if (a.points === b.points) {
            const headToHead = calculateHeadToHead(a.managerId, b.managerId, matches);
            // H2H Points
            if (headToHead.aVsB.points !== headToHead.bVsA.points) {
                return headToHead.bVsA.points - headToHead.aVsB.points;
            }
            // H2H Goals Scored
            if (headToHead.aVsB.goalsFor !== headToHead.bVsA.goalsFor) {
                return headToHead.bVsA.goalsFor - headToHead.aVsB.goalsFor;
            }
            // H2H Goals Conceded (more conceded = higher rank)
            if (headToHead.aVsB.goalsAgainst !== headToHead.bVsA.goalsAgainst) {
                return headToHead.bVsA.goalsAgainst - headToHead.aVsB.goalsAgainst;
            }
        }
        // 5. Manual Tiebreaker (ascending - lower value = higher rank)
        // Only applies if at least one team has a manual tiebreaker set
        if (a.manualTiebreaker !== null || b.manualTiebreaker !== null) {
            // If both have tiebreakers, compare them
            if (a.manualTiebreaker !== null && b.manualTiebreaker !== null) {
                if (a.manualTiebreaker !== b.manualTiebreaker) {
                    return a.manualTiebreaker - b.manualTiebreaker;
                }
            }
            // If only 'a' has a tiebreaker, it ranks higher
            if (a.manualTiebreaker !== null && b.manualTiebreaker === null) {
                return -1;
            }
            // If only 'b' has a tiebreaker, it ranks higher
            if (a.manualTiebreaker === null && b.manualTiebreaker !== null) {
                return 1;
            }
        }
        // 6. Alphabetical by manager name (final tiebreaker)
        return a.managerName.localeCompare(b.managerName);
    });
}
/**
 * Calculate head-to-head record between two managers
 */ function calculateHeadToHead(managerA, managerB, matches) {
    const aVsB = {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
    };
    const bVsA = {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
    };
    // Find all matches between these two managers
    const headToHeadMatches = matches.filter((match)=>match.home_manager_id === managerA && match.away_manager_id === managerB || match.home_manager_id === managerB && match.away_manager_id === managerA);
    headToHeadMatches.forEach((match)=>{
        if (match.home_score !== null && match.away_score !== null) {
            const isAHome = match.home_manager_id === managerA;
            const aScore = isAHome ? match.home_score : match.away_score;
            const bScore = isAHome ? match.away_score : match.home_score;
            // Update games played
            aVsB.played++;
            bVsA.played++;
            // Update goals
            aVsB.goalsFor += aScore;
            aVsB.goalsAgainst += bScore;
            bVsA.goalsFor += bScore;
            bVsA.goalsAgainst += aScore;
            // Determine result
            if (aScore > bScore) {
                // A wins
                aVsB.won++;
                aVsB.points += 3;
                bVsA.lost++;
            } else if (bScore > aScore) {
                // B wins
                bVsA.won++;
                bVsA.points += 3;
                aVsB.lost++;
            } else {
                // Draw
                aVsB.drawn++;
                bVsA.drawn++;
                aVsB.points += 1;
                bVsA.points += 1;
            }
        }
    });
    // Calculate goal differences
    aVsB.goalDifference = aVsB.goalsFor - aVsB.goalsAgainst;
    bVsA.goalDifference = bVsA.goalsFor - bVsA.goalsAgainst;
    return {
        aVsB,
        bVsA
    };
}
async function updateStandingsTable(leagueId, standings) {
    try {
        // Use a single atomic upsert operation with proper conflict resolution
        const standingsData = standings.map((stats, index)=>({
                league_id: leagueId,
                manager_id: stats.managerId,
                played: stats.played,
                won: stats.won,
                drawn: stats.drawn,
                lost: stats.lost,
                goals_for: stats.goalsFor,
                goals_against: stats.goalsAgainst,
                goal_difference: stats.goalDifference,
                points: stats.points,
                position: index + 1
            }));
        // First, clear existing standings for this league using a direct delete
        const { error: deleteError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('standings').delete().eq('league_id', leagueId);
        if (deleteError) {
            console.error('Warning: Could not clear existing standings:', deleteError.message);
        // Continue with upsert as fallback
        }
        // Insert all new standings at once
        const { error: insertError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('standings').insert(standingsData);
        if (insertError) {
            console.log('Insert failed, trying upsert as fallback:', insertError.message);
            // Fallback to upsert if insert fails due to conflicts
            const { error: upsertError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('standings').upsert(standingsData, {
                onConflict: 'league_id,manager_id'
            });
            if (upsertError) {
                throw new Error(`Failed to update standings table: ${upsertError.message}`);
            }
        }
        console.log(`Successfully updated standings for league ${leagueId}`);
    } catch (error) {
        console.error('Error in updateStandingsTable:', error);
        throw error;
    }
}
async function recalculateLeagueStandings(leagueId) {
    const standings = await calculateLeagueStandings(leagueId);
    await updateStandingsTable(leagueId, standings);
    return standings;
}
async function recalculateCupGroupStandings(cupId) {
    // Get all cup matches for this cup that are completed
    const { data: cupMatches } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').select(`
      id,
      home_manager_id,
      away_manager_id,
      home_score,
      away_score,
      is_completed,
      group_name,
      stage
    `).eq('cup_id', cupId).eq('stage', 'group_stage').eq('is_completed', true);
    // If there are no completed group stage matches, nothing to calculate
    if (!cupMatches || cupMatches.length === 0) {
        console.log(`No completed group stage matches found for cup ${cupId}`);
        return;
    }
    // Get all groups in this cup
    const { data: cupGroups } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_groups').select('group_name, manager_id').eq('cup_id', cupId);
    // Group managers by their group
    const groupsByName = {};
    if (cupGroups && cupGroups.length > 0) {
        // Use explicit cup_groups if they exist
        cupGroups.forEach((group)=>{
            if (!groupsByName[group.group_name]) {
                groupsByName[group.group_name] = [];
            }
            groupsByName[group.group_name].push(group.manager_id);
        });
    } else {
        // Infer groups from cup matches if cup_groups table is empty
        console.log(`No cup_groups found, inferring from matches for cup ${cupId}`);
        cupMatches.forEach((match)=>{
            if (match.group_name) {
                if (!groupsByName[match.group_name]) {
                    groupsByName[match.group_name] = [];
                }
                // Add managers to their respective groups
                if (!groupsByName[match.group_name].includes(match.home_manager_id)) {
                    groupsByName[match.group_name].push(match.home_manager_id);
                }
                if (!groupsByName[match.group_name].includes(match.away_manager_id)) {
                    groupsByName[match.group_name].push(match.away_manager_id);
                }
            }
        });
    }
    // If no groups were found, there's nothing to calculate
    if (Object.keys(groupsByName).length === 0) {
        console.log(`No groups found for cup ${cupId}`);
        return;
    }
    // Fetch manual tiebreakers for this cup
    const allManagerIds = Object.values(groupsByName).flat();
    const { data: cupManualTiebreakers } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_manual_tiebreakers').select('manager_id, tiebreaker_value').eq('cup_id', cupId).in('manager_id', allManagerIds);
    const cupTiebreakerMap = new Map(cupManualTiebreakers?.map((t)=>[
            t.manager_id,
            t.tiebreaker_value
        ]) || []);
    // Calculate standings for each group
    const allStandings = [];
    for (const [groupName, managerIds] of Object.entries(groupsByName)){
        // Initialize stats for all managers in this group
        const groupStats = {};
        managerIds.forEach((managerId)=>{
            groupStats[managerId] = {
                managerId,
                managerName: '',
                email: '',
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0,
                manualTiebreaker: cupTiebreakerMap.get(managerId) || null
            };
        });
        // Process matches for this group
        const groupMatches = cupMatches?.filter((m)=>m.group_name === groupName) || [];
        groupMatches.forEach((match)=>{
            if (match.home_score !== null && match.away_score !== null) {
                const homeStats = groupStats[match.home_manager_id];
                const awayStats = groupStats[match.away_manager_id];
                if (homeStats && awayStats) {
                    // Update games played
                    homeStats.played++;
                    awayStats.played++;
                    // Update goals
                    homeStats.goalsFor += match.home_score;
                    homeStats.goalsAgainst += match.away_score;
                    awayStats.goalsFor += match.away_score;
                    awayStats.goalsAgainst += match.home_score;
                    // Determine result
                    if (match.home_score > match.away_score) {
                        homeStats.won++;
                        homeStats.points += 3;
                        awayStats.lost++;
                    } else if (match.away_score > match.home_score) {
                        awayStats.won++;
                        awayStats.points += 3;
                        homeStats.lost++;
                    } else {
                        homeStats.drawn++;
                        awayStats.drawn++;
                        homeStats.points += 1;
                        awayStats.points += 1;
                    }
                }
            }
        });
        // Calculate goal difference and sort
        Object.values(groupStats).forEach((stats)=>{
            stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
        });
        const sorted = sortStandingsWithTiebreakers(Object.values(groupStats), groupMatches);
        // Convert to cup standings format
        sorted.forEach((stats, index)=>{
            allStandings.push({
                cup_id: cupId,
                group_name: groupName,
                manager_id: stats.managerId,
                played: stats.played,
                won: stats.won,
                drawn: stats.drawn,
                lost: stats.lost,
                goals_for: stats.goalsFor,
                goals_against: stats.goalsAgainst,
                goal_difference: stats.goalDifference,
                points: stats.points,
                position: index + 1,
                qualified: index < 2 // Top 2 qualify
            });
        });
    }
    // Update database
    // First delete existing standings for this cup
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_group_standings').delete().eq('cup_id', cupId);
    // Insert new standings
    if (allStandings.length > 0) {
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_group_standings').insert(allStandings);
        if (error) {
            console.error('Error updating cup group standings:', error);
            throw error;
        }
    }
    console.log(`Successfully updated cup group standings for cup ${cupId}`);
}
}),
"[project]/src/app/api/gameweeks/[id]/lineups/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$standings$2d$calculator$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/standings-calculator.ts [app-route] (ecmascript)");
;
;
;
;
async function GET(request, { params }) {
    try {
        const { userId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const { id: gameweekId } = await params;
        // Get matches for this gameweek
        const { data: matches, error: matchError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('matches').select(`
        *,
        home_manager:users!matches_home_manager_id_fkey(
          id,
          email,
          first_name,
          last_name
        ),
        away_manager:users!matches_away_manager_id_fkey(
          id,
          email,
          first_name,
          last_name
        ),
        gameweeks(
          id,
          week,
          league_id,
          leagues(name, season)
        )
      `).eq('gameweek_id', gameweekId).order('id', {
            ascending: true
        });
        if (matchError) {
            console.error('Error fetching matches:', matchError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: matchError.message
            }, {
                status: 500
            });
        }
        // Get all lineups for this gameweek with manager and player details
        const { data: lineups, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('lineups').select(`
        *,
        users!lineups_manager_id_fkey(
          id,
          email,
          first_name,
          last_name
        ),
        gameweeks(
          id,
          week,
          league_id,
          leagues(name, season)
        )
      `).eq('gameweek_id', gameweekId);
        if (error) {
            console.error('Error fetching lineups:', error);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: error.message
            }, {
                status: 500
            });
        }
        // OPTIMIZED: Batch fetch all players and results to avoid N+1 queries
        // Collect all unique player IDs across all lineups
        const allPlayerIds = Array.from(new Set((lineups || []).flatMap((lineup)=>lineup.player_ids || []).filter(Boolean)));
        // Batch fetch all players
        let playersMap = new Map();
        if (allPlayerIds.length > 0) {
            const { data: players, error: playersError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('players').select('*').in('id', allPlayerIds);
            if (playersError) {
                console.error('Error fetching players:', playersError);
            } else {
                playersMap = new Map(players?.map((p)=>[
                        p.id,
                        p
                    ]) || []);
            }
        }
        // Batch fetch all results for this gameweek
        let resultsMap = new Map();
        if (allPlayerIds.length > 0) {
            const { data: results, error: resultsError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('results').select('player_id, goals, has_played').eq('gameweek_id', gameweekId).in('player_id', allPlayerIds);
            if (resultsError) {
                console.error('Error fetching results:', resultsError);
            } else {
                resultsMap = new Map(results?.map((r)=>[
                        r.player_id,
                        {
                            goals: r.goals,
                            has_played: r.has_played
                        }
                    ]) || []);
            }
        }
        // Map lineups with their players and results (no more async operations)
        const lineupsWithPlayers = (lineups || []).map((lineup)=>{
            if (!lineup.player_ids || lineup.player_ids.length === 0) {
                return {
                    ...lineup,
                    players: []
                };
            }
            const playersWithResults = lineup.player_ids.map((playerId)=>{
                const player = playersMap.get(playerId);
                if (!player) return null;
                const result = resultsMap.get(playerId);
                return {
                    ...player,
                    goals_scored: result?.goals || 0,
                    has_played: result?.has_played || false
                };
            }).filter(Boolean);
            return {
                ...lineup,
                players: playersWithResults
            };
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            lineups: lineupsWithPlayers,
            matches: matches || []
        });
    } catch (error) {
        console.error('Error in gameweek lineups API:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function PUT(request, { params }) {
    try {
        const { userId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const { id: gameweekId } = await params;
        const { results } = await request.json();
        if (!Array.isArray(results)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Results must be an array of { player_id, goals, has_played? } objects'
            }, {
                status: 400
            });
        }
        // Start a transaction-like operation
        const resultPromises = results.map(async ({ player_id, goals, has_played })=>{
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('results').upsert({
                gameweek_id: gameweekId,
                player_id,
                goals: parseInt(goals) || 0,
                has_played: has_played !== undefined ? has_played : false
            }, {
                onConflict: 'gameweek_id,player_id'
            });
            if (error) {
                console.error('Error updating result:', error);
                throw error;
            }
        });
        await Promise.all(resultPromises);
        // OPTIMIZED: Batch fetch all results once for lineup updates
        const { data: lineups } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('lineups').select('id, player_ids').eq('gameweek_id', gameweekId);
        if (lineups && lineups.length > 0) {
            // Fetch all results for this gameweek once
            const { data: allResults } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('results').select('player_id, goals').eq('gameweek_id', gameweekId);
            const resultsMap = new Map(allResults?.map((r)=>[
                    r.player_id,
                    r.goals
                ]) || []);
            // Calculate totals and prepare batch update
            const lineupUpdates = lineups.map((lineup)=>{
                if (!lineup.player_ids || lineup.player_ids.length === 0) {
                    return {
                        id: lineup.id,
                        total_goals: 0
                    };
                }
                const totalGoals = lineup.player_ids.reduce((sum, playerId)=>{
                    return sum + (resultsMap.get(playerId) || 0);
                }, 0);
                return {
                    id: lineup.id,
                    total_goals: totalGoals
                };
            });
            // Batch update all lineups
            for (const update of lineupUpdates){
                const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('lineups').update({
                    total_goals: update.total_goals
                }).eq('id', update.id);
                if (error) {
                    console.error('Error updating lineup total:', error);
                }
            }
        }
        // OPTIMIZED: Update match scores using already-fetched data
        const { data: matches } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('matches').select('id, home_manager_id, away_manager_id').eq('gameweek_id', gameweekId);
        if (matches && matches.length > 0) {
            // Fetch all lineups for this gameweek once (if not already fetched)
            const { data: allGameweekLineups } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('lineups').select('manager_id, player_ids').eq('gameweek_id', gameweekId);
            // Create a map of manager_id -> lineup
            const lineupsMapByManager = new Map(allGameweekLineups?.map((l)=>[
                    l.manager_id,
                    l
                ]) || []);
            // We already have resultsMap from the lineup updates above
            // Reuse it or fetch again if needed
            const { data: allResults } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('results').select('player_id, goals').eq('gameweek_id', gameweekId);
            const resultsMap = new Map(allResults?.map((r)=>[
                    r.player_id,
                    r.goals
                ]) || []);
            // Calculate match scores without additional queries
            const matchUpdates = matches.map((match)=>{
                const homeLineup = lineupsMapByManager.get(match.home_manager_id);
                const awayLineup = lineupsMapByManager.get(match.away_manager_id);
                let homeScore = 0;
                let awayScore = 0;
                if (homeLineup?.player_ids && homeLineup.player_ids.length > 0) {
                    homeScore = homeLineup.player_ids.reduce((sum, playerId)=>{
                        return sum + (resultsMap.get(playerId) || 0);
                    }, 0);
                }
                if (awayLineup?.player_ids && awayLineup.player_ids.length > 0) {
                    awayScore = awayLineup.player_ids.reduce((sum, playerId)=>{
                        return sum + (resultsMap.get(playerId) || 0);
                    }, 0);
                }
                return {
                    id: match.id,
                    home_score: homeScore,
                    away_score: awayScore,
                    is_completed: true
                };
            });
            // Batch update all matches
            for (const update of matchUpdates){
                const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('matches').update({
                    home_score: update.home_score,
                    away_score: update.away_score,
                    is_completed: update.is_completed
                }).eq('id', update.id);
                if (error) {
                    console.error('Error updating match score:', error);
                }
            }
        }
        // Update cup match scores
        const { data: cupGameweeks } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_gameweeks').select('id, cup_id').eq('league_gameweek_id', gameweekId);
        if (cupGameweeks && cupGameweeks.length > 0) {
            // Collect unique cup IDs for standings recalculation
            const cupIds = new Set();
            for (const cupGameweek of cupGameweeks){
                cupIds.add(cupGameweek.cup_id);
                // Get cup matches for this cup gameweek
                const { data: cupMatches } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').select('id, home_manager_id, away_manager_id').eq('cup_gameweek_id', cupGameweek.id);
                if (cupMatches && cupMatches.length > 0) {
                    // Get cup lineups for this cup gameweek
                    const { data: cupLineups } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_lineups').select('manager_id, player_ids').eq('cup_gameweek_id', cupGameweek.id);
                    const cupLineupsMapByManager = new Map(cupLineups?.map((l)=>[
                            l.manager_id,
                            l
                        ]) || []);
                    // Reuse the resultsMap from above
                    const { data: allResults } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('results').select('player_id, goals').eq('gameweek_id', gameweekId);
                    const resultsMap = new Map(allResults?.map((r)=>[
                            r.player_id,
                            r.goals
                        ]) || []);
                    // Calculate cup match scores
                    const cupMatchUpdates = cupMatches.map((match)=>{
                        const homeLineup = cupLineupsMapByManager.get(match.home_manager_id);
                        const awayLineup = cupLineupsMapByManager.get(match.away_manager_id);
                        let homeScore = 0;
                        let awayScore = 0;
                        if (homeLineup?.player_ids && homeLineup.player_ids.length > 0) {
                            homeScore = homeLineup.player_ids.reduce((sum, playerId)=>{
                                return sum + (resultsMap.get(playerId) || 0);
                            }, 0);
                        }
                        if (awayLineup?.player_ids && awayLineup.player_ids.length > 0) {
                            awayScore = awayLineup.player_ids.reduce((sum, playerId)=>{
                                return sum + (resultsMap.get(playerId) || 0);
                            }, 0);
                        }
                        return {
                            id: match.id,
                            home_score: homeScore,
                            away_score: awayScore,
                            is_completed: true
                        };
                    });
                    // Batch update all cup matches
                    for (const update of cupMatchUpdates){
                        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').update({
                            home_score: update.home_score,
                            away_score: update.away_score,
                            is_completed: update.is_completed
                        }).eq('id', update.id);
                        if (error) {
                            console.error('Error updating cup match score:', error);
                        }
                    }
                    // Update cup lineup total_goals
                    if (cupLineups && cupLineups.length > 0) {
                        for (const lineup of cupLineups){
                            if (lineup.player_ids && lineup.player_ids.length > 0) {
                                const totalGoals = lineup.player_ids.reduce((sum, playerId)=>{
                                    return sum + (resultsMap.get(playerId) || 0);
                                }, 0);
                                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_lineups').update({
                                    total_goals: totalGoals
                                }).eq('cup_gameweek_id', cupGameweek.id).eq('manager_id', lineup.manager_id);
                            }
                        }
                    }
                }
            }
            // Recalculate cup group standings after updating all cup match results
            for (const cupId of cupIds){
                try {
                    console.log('Recalculating cup group standings for cup:', cupId);
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$standings$2d$calculator$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recalculateCupGroupStandings"])(cupId);
                    console.log('Cup group standings updated successfully');
                } catch (cupStandingsError) {
                    console.error('Error updating cup group standings:', cupStandingsError);
                // Don't fail the entire request if standings update fails
                }
            }
        }
        // Recalculate league standings after updating match results
        try {
            // Get the league ID from the gameweek
            const { data: gameweek } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').select('league_id').eq('id', gameweekId).single();
            if (gameweek?.league_id) {
                console.log('Recalculating league standings for league:', gameweek.league_id);
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$standings$2d$calculator$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recalculateLeagueStandings"])(gameweek.league_id);
                console.log('League standings updated successfully');
            }
        } catch (standingsError) {
            console.error('Error updating league standings:', standingsError);
        // Don't fail the entire request if standings update fails
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Results updated successfully'
        });
    } catch (error) {
        console.error('Error in gameweek lineups PUT API:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__580b4243._.js.map