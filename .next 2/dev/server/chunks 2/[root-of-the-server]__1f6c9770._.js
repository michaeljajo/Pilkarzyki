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
"[project]/src/app/api/gameweeks/[id]/matches-with-lineups/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
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
        // First, get the gameweek info
        const { data: gameweek, error: gameweekError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').select(`
        id,
        week,
        league_id,
        leagues:league_id (
          name,
          season
        )
      `).eq('id', gameweekId).single();
        if (gameweekError || !gameweek) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Gameweek not found'
            }, {
                status: 404
            });
        }
        // Get matches for this gameweek with manager details
        const { data: matches, error: matchError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('matches').select(`
        id,
        gameweek_id,
        home_manager_id,
        away_manager_id,
        home_score,
        away_score,
        is_completed,
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
        // Fetch squads for all managers in these matches to get team names
        const managerIds = Array.from(new Set((matches || []).flatMap((m)=>[
                m.home_manager_id,
                m.away_manager_id
            ])));
        const { data: squads } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('manager_id, team_name').eq('league_id', gameweek.league_id).in('manager_id', managerIds);
        const squadMap = new Map(squads?.map((s)=>[
                s.manager_id,
                s
            ]) || []);
        // OPTIMIZED: Batch fetch all lineups, players, and results to avoid N+1 queries
        // Fetch all lineups for this gameweek once
        const { data: allLineups, error: lineupsError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('lineups').select(`
        id,
        manager_id,
        gameweek_id,
        player_ids,
        total_goals,
        is_from_default,
        manager:users!lineups_manager_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `).eq('gameweek_id', gameweekId);
        if (lineupsError) {
            console.error('Error fetching lineups:', lineupsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: lineupsError.message
            }, {
                status: 500
            });
        }
        // Create a map of manager_id -> lineup
        const lineupsMap = new Map(allLineups?.map((l)=>[
                l.manager_id,
                l
            ]) || []);
        // Collect all unique player IDs from all lineups
        const allPlayerIds = Array.from(new Set((allLineups || []).flatMap((lineup)=>lineup.player_ids || []).filter(Boolean)));
        // Batch fetch all players
        let playersMap = new Map();
        if (allPlayerIds.length > 0) {
            // CRITICAL: Filter by league to prevent cross-league player confusion
            const { data: players, error: playersError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('players').select('id, name, surname, position, manager_id').in('id', allPlayerIds).eq('league', gameweek.leagues.name);
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
        // Map matches with their lineups (no more async operations!)
        const matchesWithLineups = (matches || []).map((match)=>{
            const homeLineup = lineupsMap.get(match.home_manager_id);
            const awayLineup = lineupsMap.get(match.away_manager_id);
            // Build home lineup with players
            let homeLineupWithPlayers = null;
            if (homeLineup && homeLineup.player_ids?.length > 0) {
                const homePlayersWithResults = homeLineup.player_ids.map((playerId)=>{
                    const player = playersMap.get(playerId);
                    if (!player) return null;
                    const result = resultsMap.get(playerId);
                    return {
                        ...player,
                        goals_scored: result?.goals || 0,
                        has_played: result?.has_played || false
                    };
                }).filter(Boolean);
                // Calculate actual total goals from results
                const calculatedTotalGoals = homePlayersWithResults.reduce((sum, player)=>{
                    return sum + (player.goals_scored || 0);
                }, 0);
                homeLineupWithPlayers = {
                    ...homeLineup,
                    total_goals: calculatedTotalGoals,
                    players: homePlayersWithResults
                };
            }
            // Build away lineup with players
            let awayLineupWithPlayers = null;
            if (awayLineup && awayLineup.player_ids?.length > 0) {
                const awayPlayersWithResults = awayLineup.player_ids.map((playerId)=>{
                    const player = playersMap.get(playerId);
                    if (!player) return null;
                    const result = resultsMap.get(playerId);
                    return {
                        ...player,
                        goals_scored: result?.goals || 0,
                        has_played: result?.has_played || false
                    };
                }).filter(Boolean);
                // Calculate actual total goals from results
                const calculatedTotalGoals = awayPlayersWithResults.reduce((sum, player)=>{
                    return sum + (player.goals_scored || 0);
                }, 0);
                awayLineupWithPlayers = {
                    ...awayLineup,
                    total_goals: calculatedTotalGoals,
                    players: awayPlayersWithResults
                };
            }
            // Add squad data to managers
            const homeSquad = squadMap.get(match.home_manager_id);
            const awaySquad = squadMap.get(match.away_manager_id);
            return {
                ...match,
                home_manager: {
                    ...match.home_manager,
                    squad: homeSquad || null
                },
                away_manager: {
                    ...match.away_manager,
                    squad: awaySquad || null
                },
                home_lineup: homeLineupWithPlayers,
                away_lineup: awayLineupWithPlayers
            };
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            gameweek,
            matches: matchesWithLineups
        });
    } catch (error) {
        console.error('Error in matches-with-lineups API:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1f6c9770._.js.map