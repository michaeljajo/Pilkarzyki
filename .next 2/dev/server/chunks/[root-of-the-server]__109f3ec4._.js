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
"[project]/src/app/api/leagues/[id]/combined-schedule/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
        const { id: leagueId } = await context.params;
        const { searchParams } = new URL(request.url);
        const managerId = searchParams.get('managerId');
        // Fetch league gameweeks with matches
        const { data: gameweeks, error: gameweeksError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').select(`
        id,
        week,
        start_date,
        end_date,
        lock_date,
        is_completed,
        matches (
          id,
          home_manager_id,
          away_manager_id,
          home_score,
          away_score,
          is_completed
        )
      `).eq('league_id', leagueId).order('start_date', {
            ascending: true
        });
        if (gameweeksError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: gameweeksError.message
            }, {
                status: 500
            });
        }
        // Check if league has a cup
        const { data: cup } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').select('id, name').eq('league_id', leagueId).single();
        let cupGameweeks = [];
        if (cup) {
            // Fetch cup gameweeks with matches
            const { data: cupGws, error: cupError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_gameweeks').select(`
          id,
          cup_week,
          stage,
          leg,
          gameweeks (
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
            home_score,
            away_score,
            home_aggregate_score,
            away_aggregate_score,
            is_completed,
            stage,
            leg,
            group_name
          )
        `).eq('cup_id', cup.id).order('cup_week', {
                ascending: true
            });
            if (!cupError && cupGws) {
                cupGameweeks = cupGws;
            }
        }
        // Collect all unique manager IDs
        const managerIds = new Set();
        gameweeks?.forEach((gw)=>{
            gw.matches?.forEach((match)=>{
                if (match.home_manager_id) managerIds.add(match.home_manager_id);
                if (match.away_manager_id) managerIds.add(match.away_manager_id);
            });
        });
        cupGameweeks?.forEach((gw)=>{
            gw.cup_matches?.forEach((match)=>{
                if (match.home_manager_id) managerIds.add(match.home_manager_id);
                if (match.away_manager_id) managerIds.add(match.away_manager_id);
            });
        });
        // Fetch all managers and their squad data
        const { data: users } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, first_name, last_name, email').in('id', Array.from(managerIds));
        const { data: squads } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('manager_id, team_name').eq('league_id', leagueId).in('manager_id', Array.from(managerIds));
        const squadMap = new Map(squads?.map((s)=>[
                s.manager_id,
                s
            ]) || []);
        const userMap = {};
        users?.forEach((user)=>{
            userMap[user.id] = {
                ...user,
                squad: squadMap.get(user.id)
            };
        });
        // Transform league matches
        const leagueMatches = [];
        gameweeks?.forEach((gw)=>{
            gw.matches?.forEach((match)=>{
                // Filter by manager if specified
                if (managerId && match.home_manager_id !== managerId && match.away_manager_id !== managerId) {
                    return;
                }
                leagueMatches.push({
                    id: match.id,
                    type: 'league',
                    gameweekNumber: gw.week,
                    startDate: gw.start_date,
                    endDate: gw.end_date,
                    lockDate: gw.lock_date,
                    isCompleted: match.is_completed,
                    homeManager: match.home_manager_id ? userMap[match.home_manager_id] : null,
                    awayManager: match.away_manager_id ? userMap[match.away_manager_id] : null,
                    homeScore: match.home_score,
                    awayScore: match.away_score
                });
            });
        });
        // Transform cup matches
        const cupMatches = [];
        cupGameweeks?.forEach((gw)=>{
            gw.cup_matches?.forEach((match)=>{
                // Filter by manager if specified (skip placeholders)
                if (managerId && match.home_manager_id !== managerId && match.away_manager_id !== managerId) {
                    return;
                }
                cupMatches.push({
                    id: match.id,
                    type: 'cup',
                    gameweekNumber: gw.gameweeks.week,
                    startDate: gw.gameweeks.start_date,
                    endDate: gw.gameweeks.end_date,
                    lockDate: gw.gameweeks.lock_date,
                    isCompleted: match.is_completed,
                    homeManager: match.home_manager_id ? userMap[match.home_manager_id] : null,
                    awayManager: match.away_manager_id ? userMap[match.away_manager_id] : null,
                    homeTeamSource: match.home_team_source,
                    awayTeamSource: match.away_team_source,
                    homeScore: match.home_score,
                    awayScore: match.away_score,
                    stage: match.stage,
                    leg: match.leg,
                    groupName: match.group_name
                });
            });
        });
        // Combine and sort by date
        const allMatches = [
            ...leagueMatches,
            ...cupMatches
        ].sort((a, b)=>{
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            matches: allMatches,
            managers: Array.from(managerIds).map((id)=>userMap[id]).filter(Boolean)
        });
    } catch (error) {
        console.error('Error fetching combined schedule:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__109f3ec4._.js.map