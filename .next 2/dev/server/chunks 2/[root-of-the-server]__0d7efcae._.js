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
"[project]/src/lib/auth-helpers.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getUserManagedLeagueIds",
    ()=>getUserManagedLeagueIds,
    "userAdminsAnyLeague",
    ()=>userAdminsAnyLeague,
    "verifyLeagueAdmin",
    ()=>verifyLeagueAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
;
async function verifyLeagueAdmin(clerkUserId, leagueId) {
    try {
        // Get user's internal ID
        const { data: userRecord, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id').eq('clerk_id', clerkUserId).single();
        if (userError || !userRecord) {
            return {
                isAdmin: false,
                error: 'User not found'
            };
        }
        // Get league and check admin_id
        const { data: league, error: leagueError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select('admin_id').eq('id', leagueId).single();
        if (leagueError || !league) {
            return {
                isAdmin: false,
                error: 'League not found'
            };
        }
        // Check if user is the admin
        const isAdmin = league.admin_id === userRecord.id;
        return {
            isAdmin,
            userInternalId: userRecord.id,
            error: isAdmin ? undefined : 'You are not the admin of this league'
        };
    } catch (error) {
        console.error('Error verifying league admin:', error);
        return {
            isAdmin: false,
            error: 'Internal server error'
        };
    }
}
async function userAdminsAnyLeague(clerkUserId) {
    try {
        // Get user's internal ID and admin status
        const { data: userRecord, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, is_admin').eq('clerk_id', clerkUserId).single();
        if (userError || !userRecord) {
            return false;
        }
        // Global admins always have access
        if (userRecord.is_admin === true) {
            return true;
        }
        // Check if user is admin of any league
        const { data: leagues, error: leaguesError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select('id').eq('admin_id', userRecord.id).eq('is_active', true).limit(1);
        if (leaguesError) {
            console.error('Error checking leagues:', leaguesError);
            return false;
        }
        return leagues && leagues.length > 0;
    } catch (error) {
        console.error('Error checking if user admins any league:', error);
        return false;
    }
}
async function getUserManagedLeagueIds(clerkUserId) {
    try {
        // Get user's internal ID
        const { data: userRecord, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id').eq('clerk_id', clerkUserId).single();
        if (userError || !userRecord) {
            return [];
        }
        // Get squads where user is the manager
        const { data: squads, error: squadsError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('league_id').eq('manager_id', userRecord.id);
        if (squadsError) {
            console.error('Error fetching user squads:', squadsError);
            return [];
        }
        return squads?.map((squad)=>squad.league_id) || [];
    } catch (error) {
        console.error('Error getting user managed leagues:', error);
        return [];
    }
}
}),
"[project]/src/app/api/leagues/[id]/standings/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$standings$2d$calculator$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/standings-calculator.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth-helpers.ts [app-route] (ecmascript)");
;
;
;
;
;
// Simple in-memory cache to prevent concurrent calculations
const calculatingStandings = new Map();
async function GET(request, context) {
    try {
        const { userId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const { id: leagueId } = await context.params;
        // Check if league exists
        const { data: league, error: leagueError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select('id, name, season').eq('id', leagueId).single();
        if (leagueError || !league) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'League not found'
            }, {
                status: 404
            });
        }
        // Get user's database ID from Clerk ID
        const { data: user } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id').eq('clerk_id', userId).single();
        if (!user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'User not found'
            }, {
                status: 404
            });
        }
        // Verify user is a member of this league (has a squad)
        const { data: squad } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('id').eq('league_id', leagueId).eq('manager_id', user.id).single();
        if (!squad) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'You are not a member of this league'
            }, {
                status: 403
            });
        }
        // Get standings from database (cached)
        const { data: standingsData, error: standingsError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('standings').select(`
        *,
        users!standings_manager_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `).eq('league_id', leagueId).order('position', {
            ascending: true
        });
        if (standingsError) {
            console.error('Error fetching standings:', standingsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to fetch standings'
            }, {
                status: 500
            });
        }
        // Fetch squad team names for this league
        const managerIds = standingsData?.map((s)=>s.manager_id) || [];
        const { data: squads } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('manager_id, team_name').eq('league_id', leagueId).in('manager_id', managerIds);
        const squadMap = new Map(squads?.map((s)=>[
                s.manager_id,
                s
            ]) || []);
        // If no standings exist, calculate them (with race condition protection)
        if (!standingsData || standingsData.length === 0) {
            console.log('No standings found, calculating...');
            // Check if standings are already being calculated for this league
            const existingCalculation = calculatingStandings.get(leagueId);
            if (existingCalculation) {
                console.log('Standings already being calculated, waiting...');
                try {
                    const calculatedStandings = await existingCalculation;
                    calculatingStandings.delete(leagueId);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        league,
                        standings: calculatedStandings.map((standing, index)=>({
                                position: index + 1,
                                managerId: standing.managerId,
                                managerName: standing.managerName,
                                teamName: standing.teamName || null,
                                email: standing.email,
                                played: standing.played,
                                won: standing.won,
                                drawn: standing.drawn,
                                lost: standing.lost,
                                goalsFor: standing.goalsFor,
                                goalsAgainst: standing.goalsAgainst,
                                goalDifference: standing.goalDifference,
                                points: standing.points
                            }))
                    });
                } catch (error) {
                    calculatingStandings.delete(leagueId);
                    throw error;
                }
            }
            // Start new calculation and store promise
            const calculationPromise = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$standings$2d$calculator$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recalculateLeagueStandings"])(leagueId);
            calculatingStandings.set(leagueId, calculationPromise);
            try {
                const calculatedStandings = await calculationPromise;
                calculatingStandings.delete(leagueId);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    league,
                    standings: calculatedStandings.map((standing, index)=>({
                            position: index + 1,
                            managerId: standing.managerId,
                            managerName: standing.managerName,
                            teamName: standing.teamName || null,
                            email: standing.email,
                            played: standing.played,
                            won: standing.won,
                            drawn: standing.drawn,
                            lost: standing.lost,
                            goalsFor: standing.goalsFor,
                            goalsAgainst: standing.goalsAgainst,
                            goalDifference: standing.goalDifference,
                            points: standing.points
                        }))
                });
            } catch (error) {
                calculatingStandings.delete(leagueId);
                throw error;
            }
        }
        // Transform database standings to response format
        const standings = standingsData.map((standing)=>{
            const squad = squadMap.get(standing.manager_id);
            return {
                position: standing.position,
                managerId: standing.manager_id,
                managerName: standing.users ? `${standing.users.first_name || ''} ${standing.users.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
                teamName: squad?.team_name || null,
                email: standing.users?.email || '',
                played: standing.played,
                won: standing.won,
                drawn: standing.drawn,
                lost: standing.lost,
                goalsFor: standing.goals_for,
                goalsAgainst: standing.goals_against,
                goalDifference: standing.goal_difference,
                points: standing.points
            };
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            league,
            standings
        });
    } catch (error) {
        console.error('Error in standings API:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function POST(request, context) {
    try {
        const { userId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const { id: leagueId } = await context.params;
        // Verify user is admin of this league
        const { isAdmin, error: authError } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyLeagueAdmin"])(userId, leagueId);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: authError || 'Forbidden'
            }, {
                status: 403
            });
        }
        // Check if user is admin
        const { data: user, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('is_admin').eq('clerk_id', userId).single();
        if (userError || !user?.is_admin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Admin access required'
            }, {
                status: 403
            });
        }
        // Check if league exists
        const { data: league, error: leagueError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select('id, name, season').eq('id', leagueId).single();
        if (leagueError || !league) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'League not found'
            }, {
                status: 404
            });
        }
        // Recalculate standings (with race condition protection)
        const existingCalculation = calculatingStandings.get(leagueId);
        let standings;
        if (existingCalculation) {
            console.log('Standings already being calculated, waiting...');
            try {
                standings = await existingCalculation;
                calculatingStandings.delete(leagueId);
            } catch (error) {
                calculatingStandings.delete(leagueId);
                throw error;
            }
        } else {
            // Start new calculation
            const calculationPromise = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$standings$2d$calculator$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recalculateLeagueStandings"])(leagueId);
            calculatingStandings.set(leagueId, calculationPromise);
            try {
                standings = await calculationPromise;
                calculatingStandings.delete(leagueId);
            } catch (error) {
                calculatingStandings.delete(leagueId);
                throw error;
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Standings recalculated successfully',
            league,
            standings: standings.map((standing, index)=>({
                    position: index + 1,
                    managerId: standing.managerId,
                    managerName: standing.managerName,
                    teamName: standing.teamName || null,
                    email: standing.email,
                    played: standing.played,
                    won: standing.won,
                    drawn: standing.drawn,
                    lost: standing.lost,
                    goalsFor: standing.goalsFor,
                    goalsAgainst: standing.goalsAgainst,
                    goalDifference: standing.goalDifference,
                    points: standing.points
                }))
        });
    } catch (error) {
        console.error('Error recalculating standings:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0d7efcae._.js.map