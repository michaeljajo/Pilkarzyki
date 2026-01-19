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
"[project]/src/app/api/cups/[id]/results/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
        const { id: cupId } = await context.params;
        // Get cup details
        const { data: cup, error: cupError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').select(`
        id,
        name,
        stage,
        league_id,
        leagues:league_id (
          id,
          name,
          season
        )
      `).eq('id', cupId).single();
        if (cupError || !cup) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Cup not found'
            }, {
                status: 404
            });
        }
        // Get user's internal ID
        const { data: userRecord } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id').eq('clerk_id', userId).single();
        if (!userRecord) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'User not found'
            }, {
                status: 404
            });
        }
        // Verify user is a member of this league (has a squad)
        const { data: userSquad } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('id').eq('league_id', cup.league_id).eq('manager_id', userRecord.id).single();
        if (!userSquad) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Access denied. You are not a member of this league.'
            }, {
                status: 403
            });
        }
        // Fetch all cup gameweeks with matches
        const { data: cupGameweeks, error: gameweeksError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_gameweeks').select(`
        id,
        cup_week,
        stage,
        leg,
        gameweeks:league_gameweek_id (
          id,
          week,
          start_date,
          end_date,
          lock_date,
          is_completed
        ),
        cup_matches (
          id,
          home_manager_id,
          away_manager_id,
          home_team_source,
          away_team_source,
          stage,
          leg,
          group_name,
          home_score,
          away_score,
          home_aggregate_score,
          away_aggregate_score,
          is_completed,
          winner_id
        )
      `).eq('cup_id', cupId).order('cup_week', {
            ascending: true
        });
        if (gameweeksError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: gameweeksError.message
            }, {
                status: 500
            });
        }
        // Collect all unique manager IDs from matches (skip null placeholders)
        const managerIds = new Set();
        cupGameweeks?.forEach((gw)=>{
            gw.cup_matches?.forEach((match)=>{
                if (match.home_manager_id) managerIds.add(match.home_manager_id);
                if (match.away_manager_id) managerIds.add(match.away_manager_id);
            });
        });
        // Fetch user data for all managers with their squad team names
        const { data: users } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, first_name, last_name, email').in('id', Array.from(managerIds));
        // Fetch squad team names for this league
        const { data: squads } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('manager_id, team_name').eq('league_id', cup.league_id).in('manager_id', Array.from(managerIds));
        const squadMap = new Map(squads?.map((s)=>[
                s.manager_id,
                s
            ]) || []);
        const userMap = new Map(users?.map((u)=>[
                u.id,
                {
                    ...u,
                    squad: squadMap.get(u.id)
                }
            ]) || []);
        // Fetch all cup lineups for this cup
        const cupGameweekIds = cupGameweeks?.map((gw)=>gw.id) || [];
        const { data: allCupLineups } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_lineups').select(`
        id,
        manager_id,
        cup_gameweek_id,
        player_ids,
        total_goals,
        is_from_default
      `).in('cup_gameweek_id', cupGameweekIds);
        // Create map of cup_gameweek_id + manager_id -> lineup
        const lineupsMap = new Map(allCupLineups?.map((l)=>[
                `${l.cup_gameweek_id}_${l.manager_id}`,
                l
            ]) || []);
        // Collect all unique player IDs
        const allPlayerIds = Array.from(new Set((allCupLineups || []).flatMap((lineup)=>lineup.player_ids || []).filter(Boolean)));
        // Batch fetch all players (filter by league to avoid cross-league duplicates)
        const playersMap = new Map();
        if (allPlayerIds.length > 0) {
            const leagueName = Array.isArray(cup.leagues) ? cup.leagues[0]?.name : cup.leagues?.name;
            const { data: players } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('players').select('id, name, surname, position, manager_id').in('id', allPlayerIds).eq('league', leagueName) // CRITICAL: Filter by league to prevent cross-league player confusion
            ;
            players?.forEach((p)=>playersMap.set(p.id, p));
        }
        // Batch fetch all results for all gameweeks
        const leagueGameweekIds = cupGameweeks?.map((gw)=>{
            const gameweek = Array.isArray(gw.gameweeks) ? gw.gameweeks[0] : gw.gameweeks;
            return gameweek?.id;
        }).filter(Boolean) || [];
        const resultsMap = new Map();
        if (allPlayerIds.length > 0 && leagueGameweekIds.length > 0) {
            const { data: results } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('results').select('player_id, gameweek_id, goals, has_played').in('gameweek_id', leagueGameweekIds).in('player_id', allPlayerIds);
            results?.forEach((r)=>{
                resultsMap.set(`${r.gameweek_id}_${r.player_id}`, {
                    goals: r.goals,
                    has_played: r.has_played
                });
            });
        }
        // Build response with all data
        const gameweeksWithMatches = cupGameweeks?.map((gw)=>{
            const gameweek = Array.isArray(gw.gameweeks) ? gw.gameweeks[0] : gw.gameweeks;
            const matchesWithLineups = gw.cup_matches?.map((match)=>{
                const homeLineup = lineupsMap.get(`${gw.id}_${match.home_manager_id}`);
                const awayLineup = lineupsMap.get(`${gw.id}_${match.away_manager_id}`);
                // Build home lineup with players and results
                let homeLineupWithPlayers = null;
                if (homeLineup && homeLineup.player_ids?.length > 0) {
                    const homePlayersWithResults = homeLineup.player_ids.map((playerId)=>{
                        const player = playersMap.get(playerId);
                        if (!player) return null;
                        const result = resultsMap.get(`${gameweek?.id}_${playerId}`);
                        return {
                            ...player,
                            goals_scored: result?.goals || 0,
                            has_played: result?.has_played || false
                        };
                    }).filter(Boolean);
                    homeLineupWithPlayers = {
                        ...homeLineup,
                        players: homePlayersWithResults
                    };
                }
                // Build away lineup with players and results
                let awayLineupWithPlayers = null;
                if (awayLineup && awayLineup.player_ids?.length > 0) {
                    const awayPlayersWithResults = awayLineup.player_ids.map((playerId)=>{
                        const player = playersMap.get(playerId);
                        if (!player) return null;
                        const result = resultsMap.get(`${gameweek?.id}_${playerId}`);
                        return {
                            ...player,
                            goals_scored: result?.goals || 0,
                            has_played: result?.has_played || false
                        };
                    }).filter(Boolean);
                    awayLineupWithPlayers = {
                        ...awayLineup,
                        players: awayPlayersWithResults
                    };
                }
                return {
                    ...match,
                    home_manager: match.home_manager_id ? userMap.get(match.home_manager_id) : null,
                    away_manager: match.away_manager_id ? userMap.get(match.away_manager_id) : null,
                    home_lineup: homeLineupWithPlayers,
                    away_lineup: awayLineupWithPlayers
                };
            });
            return {
                id: gw.id,
                cup_week: gw.cup_week,
                stage: gw.stage,
                leg: gw.leg,
                gameweek: gameweek,
                matches: matchesWithLineups
            };
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            cup,
            gameweeks: gameweeksWithMatches || []
        });
    } catch (error) {
        console.error('Error fetching cup results:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5ae35c9e._.js.map