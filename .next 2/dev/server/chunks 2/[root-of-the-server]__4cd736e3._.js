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
"[project]/src/utils/transfer-resolver.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "batchGetManagersAtGameweek",
    ()=>batchGetManagersAtGameweek,
    "createPlayerTransfer",
    ()=>createPlayerTransfer,
    "getCurrentManager",
    ()=>getCurrentManager,
    "getManagerAtGameweek",
    ()=>getManagerAtGameweek,
    "getNextTransferDate",
    ()=>getNextTransferDate,
    "getPlayerTransferHistory",
    ()=>getPlayerTransferHistory,
    "validateTransferDate",
    ()=>validateTransferDate
]);
/**
 * Transfer Resolver Utilities
 * Helper functions for resolving player-manager relationships across time periods
 * Used to maintain historical data integrity during mid-season drafts
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
;
async function getManagerAtGameweek(playerId, gameweekId) {
    try {
        // Use the database function for efficient lookup
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].rpc('get_manager_at_gameweek', {
            p_player_id: playerId,
            p_gameweek_id: gameweekId
        });
        if (error) {
            console.error('Error resolving manager at gameweek:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Exception in getManagerAtGameweek:', error);
        return null;
    }
}
async function getCurrentManager(playerId) {
    try {
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].rpc('get_current_manager', {
            p_player_id: playerId
        });
        if (error) {
            console.error('Error getting current manager:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Exception in getCurrentManager:', error);
        return null;
    }
}
async function getPlayerTransferHistory(playerId) {
    try {
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('player_transfers').select('*').eq('player_id', playerId).order('effective_from', {
            ascending: true
        });
        if (error) {
            console.error('Error fetching player transfer history:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Exception in getPlayerTransferHistory:', error);
        return [];
    }
}
async function createPlayerTransfer(playerId, managerId, effectiveFrom, transferType, createdBy, notes) {
    try {
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('player_transfers').insert({
            player_id: playerId,
            manager_id: managerId,
            effective_from: effectiveFrom.toISOString(),
            effective_until: null,
            transfer_type: transferType,
            created_by: createdBy,
            notes: notes
        }).select().single();
        if (error) {
            console.error('Error creating player transfer:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Exception in createPlayerTransfer:', error);
        return null;
    }
}
async function batchGetManagersAtGameweek(playerIds, gameweekId) {
    const resultMap = new Map();
    if (playerIds.length === 0) {
        return resultMap;
    }
    try {
        // Get gameweek start date
        const { data: gameweek, error: gameweekError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').select('start_date').eq('id', gameweekId).single();
        if (gameweekError || !gameweek) {
            console.error('Error fetching gameweek:', gameweekError);
            return resultMap;
        }
        const gameweekStart = gameweek.start_date;
        // Fetch all relevant transfers in one query
        const { data: transfers, error: transfersError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('player_transfers').select('player_id, manager_id, effective_from, effective_until').in('player_id', playerIds).lte('effective_from', gameweekStart).or(`effective_until.is.null,effective_until.gte.${gameweekStart}`);
        if (transfersError) {
            console.error('Error fetching transfers:', transfersError);
            return resultMap;
        }
        // For each player, find the most recent transfer before/during gameweek
        for (const playerId of playerIds){
            const playerTransfers = transfers?.filter((t)=>t.player_id === playerId) || [];
            if (playerTransfers.length === 0) {
                resultMap.set(playerId, null);
                continue;
            }
            // Sort by effective_from descending and take the first one
            const activeTransfer = playerTransfers.sort((a, b)=>new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())[0];
            resultMap.set(playerId, activeTransfer.manager_id);
        }
        return resultMap;
    } catch (error) {
        console.error('Exception in batchGetManagersAtGameweek:', error);
        return resultMap;
    }
}
async function getNextTransferDate(leagueId) {
    try {
        // Find the next gameweek that hasn't started yet
        const { data: nextGameweek, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').select('start_date, lock_date').eq('league_id', leagueId).gte('lock_date', new Date().toISOString()).order('week', {
            ascending: true
        }).limit(1).single();
        if (error || !nextGameweek) {
            console.error('Error finding next gameweek:', error);
            return null;
        }
        return new Date(nextGameweek.start_date);
    } catch (error) {
        console.error('Exception in getNextTransferDate:', error);
        return null;
    }
}
async function validateTransferDate(leagueId, effectiveDate) {
    try {
        // Check if the effective date falls within or before any completed gameweeks
        // A transfer is invalid if it would affect gameweeks that are already locked/completed
        const { data: conflictingGameweeks, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').select('week, start_date, end_date, is_completed').eq('league_id', leagueId).eq('is_completed', true).gte('end_date', effectiveDate.toISOString());
        if (error) {
            return {
                isValid: false,
                error: 'Error validating transfer date'
            };
        }
        if (conflictingGameweeks && conflictingGameweeks.length > 0) {
            const weeks = conflictingGameweeks.map((gw)=>gw.week).join(', ');
            return {
                isValid: false,
                error: `Cannot backdate transfers into locked/completed gameweeks: ${weeks}`
            };
        }
        return {
            isValid: true
        };
    } catch (error) {
        console.error('Exception in validateTransferDate:', error);
        return {
            isValid: false,
            error: 'Exception during validation'
        };
    }
}
}),
"[project]/src/app/api/leagues/[id]/top-scorers/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transfer$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/transfer-resolver.ts [app-route] (ecmascript)");
;
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
        const { id: leagueId } = await context.params;
        // Get user's internal ID
        const { data: userRecord } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id').eq('clerk_id', userId).single();
        if (!userRecord) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'User not found'
            }, {
                status: 404
            });
        }
        // Verify user is a member of this league (has a squad) and get league name
        const { data: league } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select('name').eq('id', leagueId).single();
        if (!league) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'League not found'
            }, {
                status: 404
            });
        }
        const leagueName = league.name;
        const { data: userSquad } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('id').eq('league_id', leagueId).eq('manager_id', userRecord.id).single();
        if (!userSquad) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Access denied. You are not a member of this league.'
            }, {
                status: 403
            });
        }
        // Fetch all league lineups for this league to determine which players participated in league matches
        // We need to:
        // 1. Get all gameweeks for this league
        // 2. Get all league lineups for those gameweeks
        // 3. Get results only for players who were in league lineups
        // 4. Aggregate goals by player
        // 5. Join with players to get player details
        // 6. Join with users to get manager names
        // Get all gameweeks for this league
        const { data: gameweeks, error: gameweeksError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').select('id').eq('league_id', leagueId);
        if (gameweeksError) {
            console.error('Error fetching gameweeks:', gameweeksError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to fetch gameweeks'
            }, {
                status: 500
            });
        }
        if (!gameweeks || gameweeks.length === 0) {
            // No gameweeks yet
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                topScorers: []
            });
        }
        const gameweekIds = gameweeks.map((gw)=>gw.id);
        // Get all league lineups for these gameweeks
        const { data: leagueLineups, error: leagueLineupsError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('lineups').select('player_ids, gameweek_id').in('gameweek_id', gameweekIds);
        if (leagueLineupsError) {
            console.error('Error fetching league lineups:', leagueLineupsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to fetch league lineups'
            }, {
                status: 500
            });
        }
        // Build a set of (gameweek_id + player_id) for players in league lineups
        const leaguePlayersSet = new Set();
        leagueLineups?.forEach((lineup)=>{
            lineup.player_ids?.forEach((playerId)=>{
                leaguePlayersSet.add(`${lineup.gameweek_id}_${playerId}`);
            });
        });
        if (leaguePlayersSet.size === 0) {
            // No players in league lineups yet
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                topScorers: []
            });
        }
        // Fetch results for these gameweeks
        const { data: resultsData, error: resultsError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('results').select('player_id, goals, gameweek_id').in('gameweek_id', gameweekIds).gt('goals', 0);
        console.log('Top Scorers Debug - League ID:', leagueId);
        console.log('Top Scorers Debug - Results count:', resultsData?.length);
        console.log('Top Scorers Debug - First few results:', resultsData?.slice(0, 3));
        if (resultsError) {
            console.error('Error fetching results:', resultsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to fetch results'
            }, {
                status: 500
            });
        }
        // Filter results to only include players who were in league lineups
        // and aggregate goals by (player, historical manager) combination
        // This ensures goals are attributed to the manager who owned the player at the time
        const playerManagerGoalsMap = new Map();
        // Group results by gameweek for batch manager resolution
        const gameweekResultsMap = new Map();
        resultsData?.forEach((result)=>{
            const key = `${result.gameweek_id}_${result.player_id}`;
            if (leaguePlayersSet.has(key)) {
                if (!gameweekResultsMap.has(result.gameweek_id)) {
                    gameweekResultsMap.set(result.gameweek_id, []);
                }
                gameweekResultsMap.get(result.gameweek_id).push(result);
            }
        });
        // Resolve historical managers for each gameweek
        for (const [gameweekId, gameweekResults] of gameweekResultsMap.entries()){
            const playerIds = gameweekResults.map((r)=>r.player_id);
            const managerMap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transfer$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["batchGetManagersAtGameweek"])(playerIds, gameweekId);
            // Aggregate goals by (player, manager) combination
            for (const result of gameweekResults){
                const managerId = managerMap.get(result.player_id) || null;
                const compositeKey = `${result.player_id}:${managerId || 'unassigned'}`;
                const existing = playerManagerGoalsMap.get(compositeKey);
                if (existing) {
                    existing.totalGoals += result.goals;
                    existing.gameweeks.add(result.gameweek_id);
                } else {
                    playerManagerGoalsMap.set(compositeKey, {
                        playerId: result.player_id,
                        managerId,
                        totalGoals: result.goals,
                        gameweeks: new Set([
                            result.gameweek_id
                        ])
                    });
                }
            }
        }
        // Get all unique player IDs and manager IDs
        const playerIds = Array.from(new Set(Array.from(playerManagerGoalsMap.values()).map((v)=>v.playerId)));
        const managerIds = Array.from(new Set(Array.from(playerManagerGoalsMap.values()).map((v)=>v.managerId).filter(Boolean)));
        if (playerIds.length === 0) {
            // No goals scored yet
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                topScorers: []
            });
        }
        // Fetch player details (without manager join - we already have historical manager)
        const { data: players, error: playersError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('players').select('id, name, surname, position').in('id', playerIds).eq('league', leagueName);
        if (playersError) {
            console.error('Error fetching players:', playersError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to fetch player details'
            }, {
                status: 500
            });
        }
        // Fetch manager details
        const { data: managers } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, first_name, last_name, email').in('id', managerIds);
        // Fetch squad team names for this league
        const { data: squads } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('manager_id, team_name').eq('league_id', leagueId).in('manager_id', managerIds);
        const playerMap = new Map(players?.map((p)=>[
                p.id,
                p
            ]) || []);
        const managerMap = new Map(managers?.map((m)=>[
                m.id,
                m
            ]) || []);
        const squadMap = new Map(squads?.map((s)=>[
                s.manager_id,
                s
            ]) || []);
        // Build top scorers array from playerManagerGoalsMap
        // Note: A player who transferred will appear multiple times (once per manager)
        const topScorers = Array.from(playerManagerGoalsMap.values()).map((stats)=>{
            const player = playerMap.get(stats.playerId);
            if (!player) return null;
            const manager = stats.managerId ? managerMap.get(stats.managerId) : null;
            const squad = stats.managerId ? squadMap.get(stats.managerId) : null;
            // Priority: team_name → first_name+last_name → email
            let managerName = 'Brak managera';
            if (manager) {
                if (squad?.team_name) {
                    managerName = squad.team_name;
                } else if (manager.first_name || manager.last_name) {
                    managerName = `${manager.first_name || ''} ${manager.last_name || ''}`.trim();
                } else {
                    managerName = manager.email;
                }
            }
            return {
                playerId: player.id,
                playerName: player.name,
                playerSurname: player.surname,
                position: player.position,
                managerId: stats.managerId || '',
                managerName,
                totalGoals: stats.totalGoals,
                gamesPlayed: stats.gameweeks.size
            };
        }).filter((scorer)=>scorer !== null).sort((a, b)=>b.totalGoals - a.totalGoals);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            topScorers
        });
    } catch (error) {
        console.error('Error in league top scorers API:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4cd736e3._.js.map