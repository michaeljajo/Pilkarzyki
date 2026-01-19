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
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

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
"[project]/src/utils/team-name-resolver.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Team name resolution utility for consistent manager/team display across the app
 * Priority: team_name > first_name + last_name > email
 */ __turbopack_context__.s([
    "formatTeamName",
    ()=>formatTeamName,
    "getTeamOrManagerName",
    ()=>getTeamOrManagerName,
    "validateTeamName",
    ()=>validateTeamName
]);
function getTeamOrManagerName(options) {
    const { manager, squad, fallbackName = 'Unknown Manager' } = options;
    // Priority 1: Team name from squad
    if (squad?.team_name) {
        return squad.team_name;
    }
    // Priority 2: Manager's first and last name
    if (manager.first_name || manager.last_name) {
        const fullName = `${manager.first_name || ''} ${manager.last_name || ''}`.trim();
        if (fullName) {
            return fullName;
        }
    }
    // Priority 3: Email address
    if (manager.email) {
        return manager.email;
    }
    // Fallback
    return fallbackName;
}
function validateTeamName(teamName) {
    if (!teamName || teamName.trim().length === 0) {
        return {
            valid: false,
            error: 'Nazwa drużyny jest wymagana'
        };
    }
    const trimmed = teamName.trim();
    if (trimmed.length < 3) {
        return {
            valid: false,
            error: 'Nazwa drużyny musi mieć co najmniej 3 znaki'
        };
    }
    if (trimmed.length > 30) {
        return {
            valid: false,
            error: 'Nazwa drużyny może mieć maksymalnie 30 znaków'
        };
    }
    // Allow alphanumeric characters, spaces, and common Polish characters
    const validPattern = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9\s]+$/;
    if (!validPattern.test(trimmed)) {
        return {
            valid: false,
            error: 'Nazwa drużyny może zawierać tylko litery, cyfry i spacje'
        };
    }
    return {
        valid: true
    };
}
function formatTeamName(teamName) {
    return teamName.trim().split(' ').filter((word)=>word.length > 0).map((word)=>word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
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
"[project]/src/app/api/admin/players/draft/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
/**
 * Mid-Season Draft Upload API
 * Handles player reassignments during mid-season draft
 * Preserves historical data by creating transfer records
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/server/clerkClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/xlsx/xlsx.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$team$2d$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/team-name-resolver.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transfer$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/transfer-resolver.ts [app-route] (ecmascript)");
;
;
;
;
;
;
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
        // Check if user is admin
        const { data: adminUser, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('is_admin, id').eq('clerk_id', userId).single();
        if (userError || !adminUser?.is_admin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Admin access required'
            }, {
                status: 403
            });
        }
        const formData = await request.formData();
        const file = formData.get('file');
        const leagueId = formData.get('leagueId');
        const effectiveDateStr = formData.get('effectiveDate');
        if (!file) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'No file uploaded'
            }, {
                status: 400
            });
        }
        if (!leagueId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'League ID required'
            }, {
                status: 400
            });
        }
        // Verify league exists and get its name
        const { data: league, error: leagueError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select('id, name').eq('id', leagueId).single();
        if (leagueError || !league) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'League not found'
            }, {
                status: 404
            });
        }
        const leagueName = league.name;
        // Determine effective date for transfers
        let effectiveDate;
        if (effectiveDateStr) {
            effectiveDate = new Date(effectiveDateStr);
        } else {
            // Default to next gameweek start date
            const nextDate = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transfer$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getNextTransferDate"])(leagueId);
            if (!nextDate) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Could not determine next transfer date. Please specify an effective date.'
                }, {
                    status: 400
                });
            }
            effectiveDate = nextDate;
        }
        // Validate transfer date doesn't affect locked gameweeks
        const validation = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transfer$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTransferDate"])(leagueId, effectiveDate);
        if (!validation.isValid) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: validation.error || 'Invalid transfer date'
            }, {
                status: 400
            });
        }
        // Parse Excel file
        const buffer = await file.arrayBuffer();
        const workbook = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["read"](buffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["utils"].sheet_to_json(worksheet);
        if (!jsonData || jsonData.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'No data found in file'
            }, {
                status: 400
            });
        }
        // Validate required columns
        const requiredColumns = [
            'Name',
            'Position',
            'Club'
        ];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter((col)=>!(col in firstRow));
        if (missingColumns.length > 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Missing required columns: ${missingColumns.join(', ')}. Optional: Manager`
            }, {
                status: 400
            });
        }
        const result = {
            success: true,
            transferred: 0,
            created: 0,
            unchanged: 0,
            unassigned: 0,
            errors: [],
            details: {
                transfers: [],
                newPlayers: [],
                unassignedPlayers: []
            }
        };
        // Get existing users from Clerk for manager matching
        const client = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clerkClient"])();
        let allClerkUsers = [];
        let offset = 0;
        const limit = 100;
        while(true){
            const clerkUsers = await client.users.getUserList({
                limit,
                offset
            });
            allClerkUsers = allClerkUsers.concat(clerkUsers.data);
            if (allClerkUsers.length >= clerkUsers.totalCount) {
                break;
            }
            offset += limit;
        }
        const existingUsers = allClerkUsers.map((user)=>({
                clerk_id: user.id,
                email: user.emailAddresses[0]?.emailAddress || '',
                first_name: user.firstName || '',
                last_name: user.lastName || ''
            }));
        // Get all existing players in this league to detect transfers
        const { data: existingPlayers } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('players').select(`
        id,
        name,
        surname,
        position,
        manager_id,
        club,
        football_league
      `).eq('league', leagueName);
        const existingPlayersMap = new Map(existingPlayers?.map((p)=>[
                `${p.name}|${p.surname}`,
                p
            ]) || []);
        // Process each row
        for(let i = 0; i < jsonData.length; i++){
            const row = jsonData[i];
            const rowNum = i + 2 // Excel row number (1-indexed + header row)
            ;
            try {
                // Validate required fields
                if (!row.Name || !row.Position || !row.Club) {
                    result.errors.push(`Row ${rowNum}: Missing required fields (Name, Position, Club)`);
                    continue;
                }
                // Validate position
                const validPositions = [
                    'Goalkeeper',
                    'Defender',
                    'Midfielder',
                    'Forward'
                ];
                if (!validPositions.includes(row.Position)) {
                    result.errors.push(`Row ${rowNum}: Invalid position "${row.Position}". Must be one of: ${validPositions.join(', ')}`);
                    continue;
                }
                // Parse full name into first name and surname
                const nameParts = row.Name.trim().split(/\s+/);
                const firstName = nameParts[0] || '';
                const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                if (!firstName) {
                    result.errors.push(`Row ${rowNum}: Name cannot be empty`);
                    continue;
                }
                // Find or resolve manager
                let newManager = null;
                if (row.Manager && row.Manager.trim()) {
                    const managerValue = row.Manager.trim();
                    const clerkManager = existingUsers.find((user)=>user.email === managerValue || `${user.first_name} ${user.last_name}`.toLowerCase() === managerValue.toLowerCase() || user.first_name?.toLowerCase() === managerValue.toLowerCase());
                    if (!clerkManager) {
                        result.errors.push(`Row ${rowNum}: Manager "${managerValue}" not found`);
                        continue;
                    }
                    // Ensure manager exists in Supabase users table
                    const { data: supabaseManager, error: managerError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, first_name, last_name, email').eq('clerk_id', clerkManager.clerk_id).single();
                    if (managerError && managerError.code === 'PGRST116') {
                        // Create manager if doesn't exist
                        const { data: createdManager, error: createError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').insert({
                            clerk_id: clerkManager.clerk_id,
                            email: clerkManager.email,
                            first_name: clerkManager.first_name,
                            last_name: clerkManager.last_name,
                            is_admin: false
                        }).select('id, first_name, last_name, email').single();
                        if (createError) {
                            result.errors.push(`Row ${rowNum}: Failed to create manager - ${createError.message}`);
                            continue;
                        }
                        newManager = createdManager;
                    } else if (managerError) {
                        result.errors.push(`Row ${rowNum}: Failed to fetch manager - ${managerError.message}`);
                        continue;
                    } else {
                        newManager = supabaseManager;
                    }
                }
                // Check if player already exists
                const playerKey = `${firstName}|${surname}`;
                const existingPlayer = existingPlayersMap.get(playerKey);
                if (existingPlayer) {
                    // EXISTING PLAYER - Check for transfer
                    const oldManagerId = existingPlayer.manager_id;
                    const newManagerId = newManager?.id || null;
                    if (oldManagerId === newManagerId) {
                        // No change in manager
                        result.unchanged++;
                        continue;
                    }
                    // TRANSFER DETECTED
                    // Get old manager name for reporting
                    let oldManagerName = 'Unassigned';
                    if (oldManagerId) {
                        const { data: oldMgr } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('first_name, last_name, email').eq('id', oldManagerId).single();
                        if (oldMgr) {
                            oldManagerName = oldMgr.first_name && oldMgr.last_name ? `${oldMgr.first_name} ${oldMgr.last_name}` : oldMgr.email;
                        }
                    }
                    const newManagerName = newManager ? newManager.first_name && newManager.last_name ? `${newManager.first_name} ${newManager.last_name}` : newManager.email : 'Unassigned';
                    // Create transfer record
                    const transfer = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transfer$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createPlayerTransfer"])(existingPlayer.id, newManagerId, effectiveDate, 'draft', adminUser.id, `Draft transfer: ${oldManagerName} → ${newManagerName}`);
                    if (!transfer) {
                        result.errors.push(`Row ${rowNum}: Failed to create transfer record for ${row.Name}`);
                        continue;
                    }
                    // Update squads
                    if (oldManagerId) {
                        // Remove from old squad
                        const { data: oldSquad } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('id').eq('manager_id', oldManagerId).eq('league_id', leagueId).single();
                        if (oldSquad) {
                            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squad_players').delete().eq('squad_id', oldSquad.id).eq('player_id', existingPlayer.id);
                        }
                    }
                    if (newManagerId) {
                        // Add to new squad (create squad if doesn't exist)
                        let squadId = null;
                        const { data: existingSquad } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('id').eq('manager_id', newManagerId).eq('league_id', leagueId).single();
                        if (existingSquad) {
                            squadId = existingSquad.id;
                        } else {
                            // Process team name if provided
                            let teamName = null;
                            if (row['Team Name'] && typeof row['Team Name'] === 'string' && row['Team Name'].trim()) {
                                const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$team$2d$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTeamName"])(row['Team Name'].trim());
                                if (validation.valid) {
                                    teamName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$team$2d$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatTeamName"])(row['Team Name'].trim());
                                }
                            }
                            const { data: newSquad, error: squadError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').insert({
                                manager_id: newManagerId,
                                league_id: leagueId,
                                team_name: teamName
                            }).select('id').single();
                            if (squadError) {
                                result.errors.push(`Row ${rowNum}: Failed to create squad - ${squadError.message}`);
                                continue;
                            }
                            squadId = newSquad.id;
                        }
                        // Add player to new squad
                        const { error: squadPlayerError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squad_players').insert({
                            squad_id: squadId,
                            player_id: existingPlayer.id
                        });
                        if (squadPlayerError && squadPlayerError.code !== '23505') {
                            result.errors.push(`Row ${rowNum}: Failed to add player to squad - ${squadPlayerError.message}`);
                            continue;
                        }
                    }
                    result.transferred++;
                    result.details.transfers.push({
                        playerName: row.Name,
                        fromManager: oldManagerName,
                        toManager: newManagerName
                    });
                } else {
                    // NEW PLAYER - Create player with transfer record
                    const { data: player, error: playerError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('players').insert({
                        name: firstName,
                        surname: surname,
                        league: leagueName,
                        position: row.Position,
                        club: row.Club,
                        football_league: row.League || null,
                        manager_id: newManager?.id || null,
                        total_goals: 0
                    }).select().single();
                    if (playerError) {
                        result.errors.push(`Row ${rowNum}: Failed to create player - ${playerError.message}`);
                        continue;
                    }
                    // Create initial transfer record for new player
                    const transfer = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transfer$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createPlayerTransfer"])(player.id, newManager?.id || null, effectiveDate, 'draft', adminUser.id, `New player added via draft`);
                    if (!transfer) {
                        result.errors.push(`Row ${rowNum}: Failed to create transfer record for new player ${row.Name}`);
                    }
                    // Add to squad if manager assigned
                    if (newManager) {
                        let squadId = null;
                        const { data: existingSquad } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('id').eq('manager_id', newManager.id).eq('league_id', leagueId).single();
                        if (existingSquad) {
                            squadId = existingSquad.id;
                        } else {
                            // Process team name if provided
                            let teamName = null;
                            if (row['Team Name'] && typeof row['Team Name'] === 'string' && row['Team Name'].trim()) {
                                const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$team$2d$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTeamName"])(row['Team Name'].trim());
                                if (validation.valid) {
                                    teamName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$team$2d$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatTeamName"])(row['Team Name'].trim());
                                }
                            }
                            const { data: newSquad, error: squadError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').insert({
                                manager_id: newManager.id,
                                league_id: leagueId,
                                team_name: teamName
                            }).select('id').single();
                            if (squadError) {
                                result.errors.push(`Row ${rowNum}: Failed to create squad - ${squadError.message}`);
                                continue;
                            }
                            squadId = newSquad.id;
                        }
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squad_players').insert({
                            squad_id: squadId,
                            player_id: player.id
                        });
                    }
                    result.created++;
                    result.details.newPlayers.push({
                        playerName: row.Name,
                        manager: newManager ? newManager.first_name && newManager.last_name ? `${newManager.first_name} ${newManager.last_name}` : newManager.email : 'Unassigned'
                    });
                }
            } catch (error) {
                result.errors.push(`Row ${rowNum}: Unexpected error - ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        // STEP 2: Detect players who are NO LONGER in the file and should be unassigned
        // Build a set of all player names that appear in the uploaded file
        const playersInFile = new Set();
        for (const row of jsonData){
            if (row.Name) {
                const nameParts = row.Name.trim().split(/\s+/);
                const firstName = nameParts[0] || '';
                const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                playersInFile.add(`${firstName}|${surname}`);
            }
        }
        // Find players in this league who have a manager but are NOT in the uploaded file
        const { data: allLeaguePlayers } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('players').select(`
        id,
        name,
        surname,
        manager_id,
        users:manager_id (
          id,
          first_name,
          last_name,
          email
        )
      `).eq('league', leagueName).not('manager_id', 'is', null) // Only players currently assigned to a manager
        ;
        // Check each assigned player - if not in file, unassign them
        for (const player of allLeaguePlayers || []){
            const playerKey = `${player.name}|${player.surname}`;
            if (!playersInFile.has(playerKey)) {
                // This player is NOT in the uploaded file - they should be unassigned
                const oldManager = Array.isArray(player.users) ? player.users[0] : player.users;
                const oldManagerName = oldManager ? oldManager.first_name && oldManager.last_name ? `${oldManager.first_name} ${oldManager.last_name}` : oldManager.email : 'Unknown';
                // Create transfer to NULL (unassigned)
                const transfer = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transfer$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createPlayerTransfer"])(player.id, null, effectiveDate, 'draft', adminUser.id, `Draft removal: Player no longer in squad`);
                if (!transfer) {
                    result.errors.push(`Failed to unassign ${player.name} ${player.surname} from ${oldManagerName}`);
                    continue;
                }
                // Remove from squad
                if (player.manager_id) {
                    const { data: squad } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('id').eq('manager_id', player.manager_id).eq('league_id', leagueId).single();
                    if (squad) {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squad_players').delete().eq('squad_id', squad.id).eq('player_id', player.id);
                    }
                }
                result.unassigned++;
                result.details.unassignedPlayers.push({
                    playerName: `${player.name} ${player.surname}`,
                    fromManager: oldManagerName
                });
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: `Draft processed. ${result.transferred} transfers, ${result.created} new players, ${result.unassigned} unassigned, ${result.unchanged} unchanged.`,
            effectiveDate: effectiveDate.toISOString(),
            result
        });
    } catch (error) {
        console.error('Draft upload error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0d29bbf6._.js.map