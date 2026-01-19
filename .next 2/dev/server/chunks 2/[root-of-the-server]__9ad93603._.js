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
"[project]/src/utils/cup-scheduling.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateGroupCount",
    ()=>calculateGroupCount,
    "canLeagueHaveCup",
    ()=>canLeagueHaveCup,
    "generateGroupNames",
    ()=>generateGroupNames,
    "generateGroupStageSchedule",
    ()=>generateGroupStageSchedule,
    "generateKnockoutBracket",
    ()=>generateKnockoutBracket,
    "generateNextKnockoutRound",
    ()=>generateNextKnockoutRound,
    "getNextStage",
    ()=>getNextStage,
    "validateGroupAssignments",
    ()=>validateGroupAssignments
]);
function canLeagueHaveCup(managerCount) {
    return managerCount === 4 || managerCount === 8 || managerCount === 16 || managerCount === 32;
}
function calculateGroupCount(managerCount) {
    if (!canLeagueHaveCup(managerCount)) {
        throw new Error('Cup tournaments only available for leagues with 4, 8, 16, or 32 managers');
    }
    if (managerCount === 4) {
        return 2 // Two groups of 2
        ;
    }
    return managerCount / 4;
}
function generateGroupNames(groupCount) {
    return Array.from({
        length: groupCount
    }, (_, i)=>String.fromCharCode(65 + i)) // A, B, C, D, ...
    ;
}
/**
 * Generate double round-robin schedule within a single group (2 or 4 managers)
 * Each manager plays every other manager twice (home and away)
 */ function generateGroupRoundRobin(managerIds) {
    if (managerIds.length !== 2 && managerIds.length !== 4) {
        throw new Error('Groups must have exactly 2 or 4 managers');
    }
    const matches = [];
    // Generate all unique pairings
    for(let i = 0; i < managerIds.length; i++){
        for(let j = i + 1; j < managerIds.length; j++){
            // First leg: i at home
            matches.push({
                home: managerIds[i],
                away: managerIds[j]
            });
            // Second leg: j at home (reverse fixture)
            matches.push({
                home: managerIds[j],
                away: managerIds[i]
            });
        }
    }
    return matches;
}
/**
 * Distribute group matches across gameweeks to ensure no manager plays twice in same week
 */ function distributeGroupMatches(matches, groupName, startWeek) {
    const scheduleMatches = [];
    const managerGameweeks = {};
    let currentWeek = startWeek;
    for (const match of matches){
        // Initialize tracking for managers if not exists
        if (!managerGameweeks[match.home]) managerGameweeks[match.home] = new Set();
        if (!managerGameweeks[match.away]) managerGameweeks[match.away] = new Set();
        // Find first week where both managers are free
        while(managerGameweeks[match.home].has(currentWeek) || managerGameweeks[match.away].has(currentWeek)){
            currentWeek++;
        }
        // Schedule the match
        scheduleMatches.push({
            homeManagerId: match.home,
            awayManagerId: match.away,
            cupWeek: currentWeek,
            stage: 'group_stage',
            leg: 1,
            groupName
        });
        // Mark both managers as busy this week
        managerGameweeks[match.home].add(currentWeek);
        managerGameweeks[match.away].add(currentWeek);
        // Try next week for next match
        currentWeek = startWeek;
    }
    return scheduleMatches;
}
function generateGroupStageSchedule(groupAssignments) {
    const allMatches = [];
    const startWeek = 1;
    for (const group of groupAssignments){
        if (group.managerIds.length !== 2 && group.managerIds.length !== 4) {
            throw new Error(`Group ${group.groupName} must have exactly 2 or 4 managers`);
        }
        // Generate round-robin matches for this group
        const groupMatches = generateGroupRoundRobin(group.managerIds);
        // Distribute matches across gameweeks
        const scheduledMatches = distributeGroupMatches(groupMatches, group.groupName, startWeek);
        allMatches.push(...scheduledMatches);
    }
    return allMatches;
}
function generateKnockoutBracket(qualifiedTeams, startWeek) {
    // Sort by group name to ensure consistent bracket
    const sortedTeams = [
        ...qualifiedTeams
    ].sort((a, b)=>a.groupName.localeCompare(b.groupName));
    // Group teams by position
    const winners = sortedTeams.filter((t)=>t.position === 1);
    const runnersUp = sortedTeams.filter((t)=>t.position === 2);
    // Create bracket: A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2, etc.
    const matches = [];
    const currentWeek = startWeek;
    // Determine stage based on number of qualified teams
    const numTeams = qualifiedTeams.length;
    let stage;
    if (numTeams === 16) stage = 'round_of_16';
    else if (numTeams === 8) stage = 'quarter_final';
    else if (numTeams === 4) stage = 'semi_final';
    else stage = 'final';
    // For 8 teams (2 groups): A1 vs B2, B1 vs A2
    // For 16 teams (4 groups): A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2
    // For 32 teams (8 groups): A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2, E1 vs F2, F1 vs E2, G1 vs H2, H1 vs G2
    for(let i = 0; i < winners.length; i += 2){
        const firstWinner = winners[i];
        const secondWinner = winners[i + 1];
        const firstRunnerUp = runnersUp[i];
        const secondRunnerUp = runnersUp[i + 1];
        // Match 1: Winner of group i vs Runner-up of group i+1
        // Leg 1
        matches.push({
            homeManagerId: firstWinner.managerId,
            awayManagerId: secondRunnerUp.managerId,
            cupWeek: currentWeek,
            stage,
            leg: 1
        });
        // Leg 2 (only if not final)
        if (stage !== 'final') {
            matches.push({
                homeManagerId: secondRunnerUp.managerId,
                awayManagerId: firstWinner.managerId,
                cupWeek: currentWeek + 1,
                stage,
                leg: 2
            });
        }
        // Match 2: Winner of group i+1 vs Runner-up of group i
        matches.push({
            homeManagerId: secondWinner.managerId,
            awayManagerId: firstRunnerUp.managerId,
            cupWeek: currentWeek,
            stage,
            leg: 1
        });
        if (stage !== 'final') {
            matches.push({
                homeManagerId: firstRunnerUp.managerId,
                awayManagerId: secondWinner.managerId,
                cupWeek: currentWeek + 1,
                stage,
                leg: 2
            });
        }
    }
    return matches;
}
function generateNextKnockoutRound(previousRoundWinners, startWeek, stage) {
    const matches = [];
    const numMatches = previousRoundWinners.length / 2;
    for(let i = 0; i < numMatches; i++){
        const home = previousRoundWinners[i * 2];
        const away = previousRoundWinners[i * 2 + 1];
        // Leg 1
        matches.push({
            homeManagerId: home,
            awayManagerId: away,
            cupWeek: startWeek,
            stage,
            leg: 1
        });
        // Leg 2 (only if not final)
        if (stage !== 'final') {
            matches.push({
                homeManagerId: away,
                awayManagerId: home,
                cupWeek: startWeek + 1,
                stage,
                leg: 2
            });
        }
    }
    return matches;
}
function getNextStage(currentStage, numQualified) {
    if (currentStage === 'group_stage') {
        // For 16 teams (4 groups), go directly to quarterfinals (skip round of 16)
        if (numQualified === 16) return 'quarter_final';
        if (numQualified === 8) return 'quarter_final';
        if (numQualified === 4) return 'semi_final';
    }
    if (currentStage === 'round_of_16') return 'quarter_final';
    if (currentStage === 'quarter_final') return 'semi_final';
    if (currentStage === 'semi_final') return 'final';
    return null // Final has no next stage
    ;
}
function validateGroupAssignments(groupAssignments, totalManagers) {
    const errors = [];
    // Check if total managers matches sum of group assignments
    const assignedManagers = groupAssignments.reduce((sum, g)=>sum + g.managerIds.length, 0);
    if (assignedManagers !== totalManagers) {
        errors.push(`Total assigned managers (${assignedManagers}) doesn't match league managers (${totalManagers})`);
    }
    // Determine expected group size based on total managers
    const expectedGroupSize = totalManagers === 4 ? 2 : 4;
    // Check if all groups have correct number of managers
    groupAssignments.forEach((group)=>{
        if (group.managerIds.length !== expectedGroupSize) {
            errors.push(`Group ${group.groupName} has ${group.managerIds.length} managers (must be ${expectedGroupSize})`);
        }
    });
    // Check for duplicate manager assignments
    const allManagerIds = groupAssignments.flatMap((g)=>g.managerIds);
    const uniqueManagerIds = new Set(allManagerIds);
    if (uniqueManagerIds.size !== allManagerIds.length) {
        errors.push('Some managers are assigned to multiple groups');
    }
    // Check if number of groups matches manager count
    const expectedGroups = totalManagers === 4 ? 2 : totalManagers / 4;
    if (groupAssignments.length !== expectedGroups) {
        errors.push(`Expected ${expectedGroups} groups but got ${groupAssignments.length}`);
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
}),
"[project]/src/app/api/cups/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth-helpers.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$cup$2d$scheduling$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/cup-scheduling.ts [app-route] (ecmascript)");
;
;
;
;
;
async function GET(request) {
    try {
        const { userId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const { searchParams } = new URL(request.url);
        const leagueId = searchParams.get('leagueId');
        if (!leagueId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'leagueId is required'
            }, {
                status: 400
            });
        }
        // Fetch cup for this league
        const { data: cup, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').select(`
        *,
        leagues (
          id,
          name,
          season
        )
      `).eq('league_id', leagueId).single();
        if (error && error.code !== 'PGRST116') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: error.message
            }, {
                status: 500
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            cup: cup || null
        });
    } catch (error) {
        console.error('Error fetching cup:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const { userId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const { leagueId, name } = await request.json();
        if (!leagueId || !name) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'leagueId and name are required'
            }, {
                status: 400
            });
        }
        // Verify user is admin of this league
        const { isAdmin, error: authError } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyLeagueAdmin"])(userId, leagueId);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: authError || 'Forbidden'
            }, {
                status: 403
            });
        }
        // Check if cup already exists for this league
        const { data: existingCup } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').select('id').eq('league_id', leagueId).single();
        if (existingCup) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Cup already exists for this league'
            }, {
                status: 400
            });
        }
        // Validate league has correct number of managers (8, 16, or 32)
        const { data: managers, error: managersError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('manager_id').eq('league_id', leagueId);
        if (managersError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to fetch managers'
            }, {
                status: 500
            });
        }
        const managerCount = managers?.length || 0;
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$cup$2d$scheduling$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["canLeagueHaveCup"])(managerCount)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Cup tournaments require exactly 4, 8, 16, or 32 managers. This league has ${managerCount}.`
            }, {
                status: 400
            });
        }
        // Create cup
        const { data: cup, error: cupError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').insert({
            league_id: leagueId,
            name,
            stage: 'group_stage',
            is_active: true
        }).select().single();
        if (cupError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: cupError.message
            }, {
                status: 500
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            cup
        }, {
            status: 201
        });
    } catch (error) {
        console.error('Error creating cup:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function DELETE(request) {
    try {
        const { userId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const { searchParams } = new URL(request.url);
        const cupId = searchParams.get('cupId');
        if (!cupId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'cupId is required'
            }, {
                status: 400
            });
        }
        // Get cup and verify admin access
        const { data: cup, error: cupError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').select('league_id').eq('id', cupId).single();
        if (cupError || !cup) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Cup not found'
            }, {
                status: 404
            });
        }
        // Verify user is admin of this league
        const { isAdmin, error: authError } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyLeagueAdmin"])(userId, cup.league_id);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: authError || 'Forbidden'
            }, {
                status: 403
            });
        }
        // Delete cup (cascades to all related tables)
        const { error: deleteError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').delete().eq('id', cupId);
        if (deleteError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: deleteError.message
            }, {
                status: 500
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Cup deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting cup:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9ad93603._.js.map