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
"[project]/src/utils/scheduling.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateRoundRobinSchedule",
    ()=>generateRoundRobinSchedule,
    "validateSchedule",
    ()=>validateSchedule
]);
function generateRoundRobinSchedule(managerIds) {
    const matches = [];
    const numManagers = managerIds.length;
    if (numManagers < 2) {
        throw new Error('Need at least 2 managers to create a schedule');
    }
    // For odd number of managers, add a "bye" placeholder
    const managers = [
        ...managerIds
    ];
    if (numManagers % 2 === 1) {
        managers.push('BYE');
    }
    const totalManagers = managers.length;
    const totalRounds = totalManagers - 1;
    let gameweek = 1;
    // Generate first round-robin (rounds 1 to totalRounds)
    for(let round = 0; round < totalRounds; round++){
        const roundMatches = [];
        for(let i = 0; i < totalManagers / 2; i++){
            const home = managers[i];
            const away = managers[totalManagers - 1 - i];
            // Skip matches involving the "BYE" team
            if (home !== 'BYE' && away !== 'BYE') {
                roundMatches.push({
                    homeManagerId: home,
                    awayManagerId: away,
                    gameweek
                });
            }
        }
        matches.push(...roundMatches);
        gameweek++;
        // Rotate all teams except the first one
        const temp = managers[1];
        for(let i = 1; i < totalManagers - 1; i++){
            managers[i] = managers[i + 1];
        }
        managers[totalManagers - 1] = temp;
    }
    // Generate second round-robin (reverse home/away)
    const secondRoundMatches = matches.map((match)=>({
            homeManagerId: match.awayManagerId,
            awayManagerId: match.homeManagerId,
            gameweek: match.gameweek + totalRounds
        }));
    return [
        ...matches,
        ...secondRoundMatches
    ];
}
function validateSchedule(matches, managerIds, totalGameweeks) {
    const errors = [];
    // Check if each manager plays each other manager exactly twice
    const matchCounts = {};
    managerIds.forEach((managerId)=>{
        matchCounts[managerId] = {};
        managerIds.forEach((opponentId)=>{
            if (managerId !== opponentId) {
                matchCounts[managerId][opponentId] = 0;
            }
        });
    });
    matches.forEach((match)=>{
        const { homeManagerId, awayManagerId } = match;
        if (matchCounts[homeManagerId] && matchCounts[homeManagerId][awayManagerId] !== undefined) {
            matchCounts[homeManagerId][awayManagerId]++;
        }
        if (matchCounts[awayManagerId] && matchCounts[awayManagerId][homeManagerId] !== undefined) {
            matchCounts[awayManagerId][homeManagerId]++;
        }
    });
    // Verify each manager plays each other manager exactly twice
    managerIds.forEach((managerId)=>{
        managerIds.forEach((opponentId)=>{
            if (managerId !== opponentId) {
                const count = matchCounts[managerId][opponentId];
                if (count !== 2) {
                    errors.push(`${managerId} plays ${opponentId} ${count} times (should be 2)`);
                }
            }
        });
    });
    // Check gameweek distribution
    const maxGameweek = Math.max(...matches.map((m)=>m.gameweek));
    if (maxGameweek > totalGameweeks) {
        errors.push(`Schedule requires ${maxGameweek} gameweeks but only ${totalGameweeks} available`);
    }
    return {
        isValid: errors.length === 0,
        errors
    };
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
"[project]/src/app/api/leagues/[id]/schedule/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$scheduling$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/scheduling.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth-helpers.ts [app-route] (ecmascript)");
;
;
;
;
;
async function POST(request, context) {
    try {
        const { userId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        console.log('POST schedule - userId:', userId);
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const { id: leagueId } = await context.params;
        console.log('POST schedule - leagueId:', leagueId);
        // Verify user is admin of this league
        const { isAdmin, error: authError } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyLeagueAdmin"])(userId, leagueId);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: authError || 'Forbidden'
            }, {
                status: 403
            });
        }
        // Verify league exists and user has admin access
        const { data: league, error: leagueError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select('admin_id, name').eq('id', leagueId).single();
        if (leagueError || !league) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'League not found'
            }, {
                status: 404
            });
        }
        // Check if user is admin of this league
        const { data: user, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, is_admin').eq('clerk_id', userId).single();
        if (userError || !user || !user.is_admin && league.admin_id !== user.id) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Insufficient permissions'
            }, {
                status: 403
            });
        }
        // Get all managers for this league
        console.log('Fetching managers for leagueId (using squads table):', leagueId);
        const { data: managers, error: managersError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('manager_id').eq('league_id', leagueId);
        console.log('Managers query result:', {
            managers,
            managersError
        });
        if (managersError) {
            console.error('Managers query error:', managersError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to fetch managers'
            }, {
                status: 500
            });
        }
        if (!managers || managers.length < 2) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Need at least 2 managers to generate schedule'
            }, {
                status: 400
            });
        }
        // Extract manager IDs
        const managerIds = managers.map((m)=>m.manager_id);
        console.log('Manager IDs:', managerIds);
        // Calculate total gameweeks using double round-robin formula: 2 * (n - 1)
        const totalGameweeks = 2 * (managerIds.length - 1);
        console.log('Total gameweeks to create:', totalGameweeks);
        // Check if schedule already exists
        console.log('Checking for existing schedule...');
        const { data: existingGameweeks } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').select('id').eq('league_id', leagueId).limit(1);
        console.log('Existing gameweeks check:', existingGameweeks);
        if (existingGameweeks && existingGameweeks.length > 0) {
            console.log('Schedule already exists, returning error');
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Schedule already exists. Delete existing schedule first.'
            }, {
                status: 400
            });
        }
        // Generate round-robin schedule
        console.log('Generating round-robin schedule...');
        const scheduleMatches = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$scheduling$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateRoundRobinSchedule"])(managerIds);
        console.log('Generated schedule matches:', scheduleMatches.length);
        console.log('Schedule matches detail:', scheduleMatches);
        // Create simplified gameweeks (just week numbers)
        // Add start_date, end_date, and lock_date as required by database schema
        const gameweeksToInsert = Array.from({
            length: totalGameweeks
        }, (_, i)=>{
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + i * 7); // Weekly intervals
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6); // End 6 days later
            const lockDate = new Date(startDate);
            lockDate.setDate(lockDate.getDate() + 5); // Lock 1 day before end date
            return {
                league_id: leagueId,
                week: i + 1,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                lock_date: lockDate.toISOString(),
                is_completed: false
            };
        });
        console.log('Creating gameweeks with dates:', {
            totalGameweeks,
            gameweeksToInsert
        });
        // Insert gameweeks
        const { data: insertedGameweeks, error: gameweeksError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').insert(gameweeksToInsert).select('id, week');
        console.log('Gameweeks creation result:', {
            insertedGameweeks,
            gameweeksError
        });
        if (gameweeksError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to create gameweeks'
            }, {
                status: 500
            });
        }
        try {
            // Create mapping of week number to gameweek ID
            const gameweekMap = insertedGameweeks.reduce((acc, gw)=>{
                acc[gw.week] = gw.id;
                return acc;
            }, {});
            console.log('Gameweek mapping:', gameweekMap);
            // Prepare match data for insertion
            const matchesToInsert = scheduleMatches.map((match)=>({
                    league_id: leagueId,
                    gameweek_id: gameweekMap[match.gameweek],
                    home_manager_id: match.homeManagerId,
                    away_manager_id: match.awayManagerId,
                    home_score: null,
                    away_score: null,
                    is_completed: false
                }));
            console.log('Matches to insert:', matchesToInsert);
            // Insert matches
            const { data: insertedMatches, error: matchesError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('matches').insert(matchesToInsert).select();
            console.log('Matches creation result:', {
                insertedMatches,
                matchesError
            });
            if (matchesError) {
                console.error('Match creation error details:', matchesError);
                // Rollback: delete the created gameweeks
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').delete().eq('league_id', leagueId);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Failed to create matches',
                    details: matchesError
                }, {
                    status: 500
                });
            }
            // Add a small delay to ensure database consistency before returning
            await new Promise((resolve)=>setTimeout(resolve, 100));
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'League schedule generated successfully',
                stats: {
                    totalGameweeks,
                    totalMatches: insertedMatches.length,
                    managersCount: managerIds.length,
                    leagueName: league.name
                }
            });
        } catch (error) {
            console.error('Unexpected error in matches creation:', error);
            // Rollback: delete the created gameweeks
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').delete().eq('league_id', leagueId);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unexpected error creating matches',
                details: error instanceof Error ? error.message : String(error)
            }, {
                status: 500
            });
        }
    } catch (error) {
        console.error('Error generating league schedule:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function DELETE(request, context) {
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
        // Verify league exists and user has admin access
        const { data: league, error: leagueError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select('admin_id, name').eq('id', leagueId).single();
        if (leagueError || !league) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'League not found'
            }, {
                status: 404
            });
        }
        // Check if user is admin of this league
        const { data: user, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, is_admin').eq('clerk_id', userId).single();
        if (userError || !user || !user.is_admin && league.admin_id !== user.id) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Insufficient permissions'
            }, {
                status: 403
            });
        }
        // Delete all matches for this league (cascading will handle references)
        const { error: matchesError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('matches').delete().eq('league_id', leagueId);
        if (matchesError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to delete matches'
            }, {
                status: 500
            });
        }
        // Delete all gameweeks for this league
        const { error: gameweeksError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').delete().eq('league_id', leagueId);
        if (gameweeksError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to delete gameweeks'
            }, {
                status: 500
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'League schedule deleted successfully',
            leagueName: league.name
        });
    } catch (error) {
        console.error('Error deleting league schedule:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
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
        console.log('GET schedule endpoint called for leagueId:', leagueId);
        // Verify user is admin of this league
        const { isAdmin, error: authError } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyLeagueAdmin"])(userId, leagueId);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: authError || 'Forbidden'
            }, {
                status: 403
            });
        }
        // First get gameweeks and matches without user joins
        const { data: gameweeks, error: gameweeksError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').select(`
        id,
        week,
        is_completed,
        matches (
          id,
          home_manager_id,
          away_manager_id,
          home_score,
          away_score,
          is_completed
        )
      `).eq('league_id', leagueId).order('week', {
            ascending: true
        });
        console.log('GET gameweeks query result:', {
            gameweeks: gameweeks ? gameweeks.length : 'null',
            totalMatches: gameweeks ? gameweeks.reduce((sum, gw)=>sum + (gw.matches?.length || 0), 0) : 0,
            gameweeksError,
            fullGameweeksData: gameweeks
        });
        if (gameweeksError) {
            console.error('Gameweeks GET error:', gameweeksError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: gameweeksError.message
            }, {
                status: 500
            });
        }
        // Get all unique manager IDs from matches
        const managerIds = new Set();
        gameweeks?.forEach((gw)=>{
            gw.matches?.forEach((match)=>{
                managerIds.add(match.home_manager_id);
                managerIds.add(match.away_manager_id);
            });
        });
        console.log('Manager IDs extracted from matches:', Array.from(managerIds));
        // Fetch user data for all managers
        const { data: users, error: usersError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, first_name, last_name, email').in('id', Array.from(managerIds));
        console.log('GET users query result:', {
            users: users ? users.length : 'null',
            usersError,
            fullUsersData: users
        });
        if (usersError) {
            console.error('Users GET error:', usersError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: usersError.message
            }, {
                status: 500
            });
        }
        // Fetch squad team names for this league
        const { data: squads, error: squadsError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('manager_id, team_name').eq('league_id', leagueId).in('manager_id', Array.from(managerIds));
        if (squadsError) {
            console.error('Squads GET error:', squadsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: squadsError.message
            }, {
                status: 500
            });
        }
        // Create squad lookup map
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
        // Merge user data into schedule
        const schedule = gameweeks?.map((gameweek)=>({
                ...gameweek,
                matches: gameweek.matches?.map((match)=>({
                        ...match,
                        home_manager: userMap[match.home_manager_id],
                        away_manager: userMap[match.away_manager_id]
                    }))
            }));
        console.log('Final schedule with user data:', {
            schedule: schedule ? schedule.length : 'null',
            totalGameweeks: schedule?.length,
            totalMatches: schedule?.reduce((sum, gw)=>sum + (gw.matches?.length || 0), 0),
            firstGameweekSample: schedule && schedule.length > 0 ? {
                id: schedule[0].id,
                week: schedule[0].week,
                matchesCount: schedule[0].matches?.length,
                firstMatchSample: schedule[0].matches && schedule[0].matches.length > 0 ? {
                    id: schedule[0].matches[0].id,
                    home_manager: schedule[0].matches[0].home_manager,
                    away_manager: schedule[0].matches[0].away_manager
                } : 'no matches'
            } : 'no gameweeks'
        });
        console.log('Schedule compilation timestamp:', new Date().toISOString());
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            schedule: schedule || [],
            hasSchedule: schedule && schedule.length > 0
        });
    } catch (error) {
        console.error('Error fetching league schedule:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__de35e266._.js.map