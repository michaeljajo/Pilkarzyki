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
"[project]/src/app/api/admin/players/import/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/server/clerkClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/xlsx/xlsx.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$team$2d$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/team-name-resolver.ts [app-route] (ecmascript)");
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
        const { data: user, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('is_admin').eq('clerk_id', userId).single();
        if (userError || !user?.is_admin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Admin access required'
            }, {
                status: 403
            });
        }
        const formData = await request.formData();
        const file = formData.get('file');
        const leagueId = formData.get('leagueId');
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
        // Validate required columns (League is not required - uses the league being imported to)
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
            imported: 0,
            skipped: 0,
            errors: [],
            details: {
                players: [],
                squads: []
            }
        };
        // Get existing users from Clerk for manager matching
        const client = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clerkClient"])();
        // Fetch ALL users by paginating through all pages
        let allClerkUsers = [];
        let offset = 0;
        const limit = 100 // Max limit per page
        ;
        while(true){
            const clerkUsers = await client.users.getUserList({
                limit,
                offset
            });
            allClerkUsers = allClerkUsers.concat(clerkUsers.data);
            // Break if we've fetched all users
            if (allClerkUsers.length >= clerkUsers.totalCount) {
                break;
            }
            offset += limit;
        }
        // Transform Clerk users to match expected format
        const existingUsers = allClerkUsers.map((user)=>({
                clerk_id: user.id,
                email: user.emailAddresses[0]?.emailAddress || '',
                first_name: user.firstName || '',
                last_name: user.lastName || ''
            }));
        // Process each row
        for(let i = 0; i < jsonData.length; i++){
            const row = jsonData[i];
            const rowNum = i + 2 // Excel row number (1-indexed + header row)
            ;
            try {
                // Validate required fields
                if (!row.Name || !row.Position || !row.Club) {
                    result.errors.push(`Row ${rowNum}: Missing required fields (Name, Position, Club)`);
                    result.skipped++;
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
                    result.skipped++;
                    continue;
                }
                // Parse full name into first name and surname
                const nameParts = row.Name.trim().split(/\s+/);
                const firstName = nameParts[0] || '';
                const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                if (!firstName) {
                    result.errors.push(`Row ${rowNum}: Name cannot be empty`);
                    result.skipped++;
                    continue;
                }
                // Manager is now optional
                let clerkManager = null;
                if (row.Manager && row.Manager.trim()) {
                    const managerValue = row.Manager.trim();
                    clerkManager = existingUsers.find((user)=>user.email === managerValue || `${user.first_name} ${user.last_name}`.toLowerCase() === managerValue.toLowerCase() || user.first_name?.toLowerCase() === managerValue.toLowerCase());
                    if (!clerkManager) {
                        result.errors.push(`Row ${rowNum}: Manager "${managerValue}" not found`);
                        result.skipped++;
                        continue;
                    }
                }
                // Ensure manager exists in Supabase users table (if manager was specified)
                let manager = null;
                if (clerkManager) {
                    const { data: supabaseManager, error: managerError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id').eq('clerk_id', clerkManager.clerk_id).single();
                    manager = supabaseManager;
                    if (managerError && managerError.code === 'PGRST116') {
                        // Manager doesn't exist in Supabase, create them
                        const { data: newManager, error: createError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').insert({
                            clerk_id: clerkManager.clerk_id,
                            email: clerkManager.email,
                            first_name: clerkManager.first_name,
                            last_name: clerkManager.last_name,
                            is_admin: false
                        }).select('id').single();
                        if (createError) {
                            result.errors.push(`Row ${rowNum}: Failed to create manager in database - ${createError.message}`);
                            result.skipped++;
                            continue;
                        }
                        manager = newManager;
                    } else if (managerError) {
                        result.errors.push(`Row ${rowNum}: Failed to fetch manager from database - ${managerError.message}`);
                        result.skipped++;
                        continue;
                    }
                    if (!manager) {
                        result.errors.push(`Row ${rowNum}: Manager data is missing`);
                        result.skipped++;
                        continue;
                    }
                }
                // Check if player already exists in this league
                const { data: existingPlayer } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('players').select('id').eq('name', firstName).eq('surname', surname).eq('league', leagueName).single();
                if (existingPlayer) {
                    result.errors.push(`Row ${rowNum}: Player "${row.Name}" already exists in ${leagueName}`);
                    result.skipped++;
                    continue;
                }
                // Insert player (using the league name from the league being imported to)
                const { data: player, error: playerError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('players').insert({
                    name: firstName,
                    surname: surname,
                    league: leagueName,
                    position: row.Position,
                    club: row.Club,
                    football_league: row.League || null,
                    manager_id: manager?.id || null,
                    total_goals: 0
                }).select().single();
                if (playerError) {
                    result.errors.push(`Row ${rowNum}: Failed to create player - ${playerError.message}`);
                    result.skipped++;
                    continue;
                }
                result.details.players.push(player);
                result.imported++;
                // Create or update squad (only if manager is assigned)
                if (manager) {
                    const { data: existingSquad } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('id, team_name').eq('manager_id', manager.id).eq('league_id', leagueId).single();
                    let squadId = existingSquad?.id;
                    // Process team name if provided
                    let teamName = null;
                    if (row['Team Name'] && typeof row['Team Name'] === 'string' && row['Team Name'].trim()) {
                        const teamNameValue = row['Team Name'].trim();
                        const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$team$2d$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTeamName"])(teamNameValue);
                        if (!validation.valid) {
                            result.errors.push(`Row ${rowNum}: Invalid team name - ${validation.error}`);
                            result.skipped++;
                            continue;
                        }
                        teamName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$team$2d$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatTeamName"])(teamNameValue);
                        // Check if team name is unique within the league
                        const { data: duplicateTeam } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('id').eq('league_id', leagueId).eq('team_name', teamName).neq('manager_id', manager.id).single();
                        if (duplicateTeam) {
                            result.errors.push(`Row ${rowNum}: Team name "${teamName}" is already taken in this league`);
                            result.skipped++;
                            continue;
                        }
                    }
                    if (!existingSquad) {
                        const { data: newSquad, error: squadError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').insert({
                            manager_id: manager.id,
                            league_id: leagueId,
                            team_name: teamName
                        }).select().single();
                        if (squadError) {
                            result.errors.push(`Row ${rowNum}: Failed to create squad - ${squadError.message}`);
                            continue;
                        }
                        squadId = newSquad.id;
                        result.details.squads.push(newSquad);
                    } else if (teamName && teamName !== existingSquad.team_name) {
                        // Update existing squad with team name if it's different
                        const { error: updateError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').update({
                            team_name: teamName
                        }).eq('id', existingSquad.id);
                        if (updateError) {
                            result.errors.push(`Row ${rowNum}: Failed to update team name - ${updateError.message}`);
                        }
                    }
                    // Add player to squad
                    if (squadId) {
                        const { error: squadPlayerError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squad_players').insert({
                            squad_id: squadId,
                            player_id: player.id
                        });
                        if (squadPlayerError) {
                            result.errors.push(`Row ${rowNum}: Failed to add player to squad - ${squadPlayerError.message}`);
                        }
                    }
                }
            } catch (error) {
                result.errors.push(`Row ${rowNum}: Unexpected error - ${error instanceof Error ? error.message : 'Unknown error'}`);
                result.skipped++;
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: `Import completed. ${result.imported} players imported, ${result.skipped} skipped.`,
            result
        });
    } catch (error) {
        console.error('Player import error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, {
            status: 500
        });
    }
}
async function GET() {
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
        const { data: user, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('is_admin').eq('clerk_id', userId).single();
        if (userError || !user?.is_admin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Admin access required'
            }, {
                status: 403
            });
        }
        // Create template data
        const templateData = [
            {
                Name: 'Lionel Messi',
                Position: 'Forward',
                Club: 'Inter Miami',
                League: 'MLS',
                Manager: 'manager@example.com',
                'Team Name': 'Miami Magic'
            },
            {
                Name: 'Virgil van Dijk',
                Position: 'Defender',
                Club: 'Liverpool FC',
                League: 'Premier League',
                Manager: 'manager@example.com',
                'Team Name': 'Miami Magic'
            },
            {
                Name: 'Luka Modric',
                Position: 'Midfielder',
                Club: 'Real Madrid',
                League: 'La Liga',
                Manager: 'manager2@example.com',
                'Team Name': 'Real Stars'
            }
        ];
        // Create workbook
        const workbook = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["utils"].book_new();
        const worksheet = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["utils"].json_to_sheet(templateData);
        // Set column widths
        worksheet['!cols'] = [
            {
                width: 20
            },
            {
                width: 12
            },
            {
                width: 20
            },
            {
                width: 20
            },
            {
                width: 25
            },
            {
                width: 20
            } // Team Name
        ];
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["utils"].book_append_sheet(workbook, worksheet, 'Players');
        // Generate buffer
        const buffer = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["write"](workbook, {
            type: 'buffer',
            bookType: 'xlsx'
        });
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="player-import-template.xlsx"'
            }
        });
    } catch (error) {
        console.error('Template download error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c47168ae._.js.map