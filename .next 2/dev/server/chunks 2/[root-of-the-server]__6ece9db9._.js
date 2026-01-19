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
"[project]/src/utils/name-resolver.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Enhanced name resolution utility for consistent user name processing
 * Handles username, first/last name, and email fallbacks consistently
 */ __turbopack_context__.s([
    "resolveUserNames",
    ()=>resolveUserNames
]);
function resolveUserNames(userData) {
    const email = userData.email || '';
    const emailPrefix = email.split('@')[0] || 'User';
    const isGmail = email.toLowerCase().endsWith('@gmail.com');
    let firstName = '';
    let lastName = '';
    if (userData.username) {
        // PRIORITY 1: Use username as primary source
        console.log('✅ Using username:', userData.username);
        if (userData.username.includes(' ')) {
            // Split on space: "John Doe" → "John" "Doe"
            const nameParts = userData.username.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
        } else if (userData.username.includes('.')) {
            // Split on dot: "john.doe" → "john" "doe"
            const nameParts = userData.username.split('.');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
        } else {
            // Single username: "johndoe" → "johndoe" ""
            firstName = userData.username;
            lastName = '';
        }
    } else if (userData.first_name || userData.last_name) {
        // PRIORITY 2: Use provided first/last names
        console.log('✅ Using first/last names');
        firstName = userData.first_name || '';
        lastName = userData.last_name || '';
    } else {
        // PRIORITY 3: Last resort - use email prefix
        console.log(`⚠️ Falling back to email prefix${isGmail ? ' (Gmail user)' : ''}`);
        firstName = emailPrefix;
        lastName = '';
    }
    // Ensure we never have completely empty names
    if (!firstName && !lastName) {
        firstName = emailPrefix;
    }
    console.log('💾 Resolved names:', {
        firstName,
        lastName,
        source: userData.username ? 'username' : userData.first_name || userData.last_name ? 'clerk_profile' : 'email_prefix',
        isGmail
    });
    return {
        firstName,
        lastName
    };
}
}),
"[project]/src/utils/validation.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculatePoints",
    ()=>calculatePoints,
    "formatPlayerName",
    ()=>formatPlayerName,
    "isValidPosition",
    ()=>isValidPosition,
    "validateDualLineups",
    ()=>validateDualLineups,
    "validateLineup",
    ()=>validateLineup
]);
function validateLineup(selectedPlayers) {
    const errors = [];
    // Must select between 1 and 3 players
    if (selectedPlayers.length < 1 || selectedPlayers.length > 3) {
        errors.push('Musisz wybrać od 1 do 3 zawodników');
        return {
            isValid: false,
            errors
        };
    }
    // Check for unique real-life football leagues
    // Support both camelCase and snake_case field names
    const leagues = selectedPlayers.map((p)=>p.footballLeague || p.football_league);
    const uniqueLeagues = new Set(leagues);
    if (uniqueLeagues.size !== selectedPlayers.length) {
        errors.push('Każdy zawodnik musi pochodzić z innej ligi');
    }
    // Check maximum 2 forwards constraint
    const forwards = selectedPlayers.filter((p)=>p.position === 'Forward');
    if (forwards.length > 2) {
        errors.push('Możesz wybrać maksymalnie 2 napastników');
    }
    // Must have at least 1 non-forward (midfielder or defender) ONLY when squad is complete (3 players)
    if (selectedPlayers.length === 3) {
        const nonForwards = selectedPlayers.filter((p)=>p.position === 'Midfielder' || p.position === 'Defender');
        if (nonForwards.length === 0) {
            errors.push('Musisz wybrać co najmniej 1 pomocnika lub obrońcę');
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
function isValidPosition(position) {
    return [
        'Goalkeeper',
        'Defender',
        'Midfielder',
        'Forward'
    ].includes(position);
}
function formatPlayerName(firstName, lastName) {
    return `${firstName} ${lastName}`.trim();
}
function calculatePoints(won, drawn, lost) {
    return won * 3 + drawn * 1 + lost * 0;
}
function validateDualLineups(leagueLineup, cupLineup) {
    const leagueValidation = validateLineup(leagueLineup);
    const cupValidation = validateLineup(cupLineup);
    const crossLineupErrors = [];
    // Check for player overlap between league and cup lineups
    const leaguePlayerIds = new Set(leagueLineup.map((p)=>p.id));
    const cupPlayerIds = new Set(cupLineup.map((p)=>p.id));
    const overlappingPlayers = leagueLineup.filter((p)=>cupPlayerIds.has(p.id));
    if (overlappingPlayers.length > 0) {
        const playerNames = overlappingPlayers.map((p)=>`${p.name} ${p.surname}`).join(', ');
        crossLineupErrors.push(`Zawodnik(cy) wybrani w obu składach: ${playerNames}`);
    }
    return {
        isValid: leagueValidation.isValid && cupValidation.isValid && crossLineupErrors.length === 0,
        leagueErrors: leagueValidation.errors,
        cupErrors: cupValidation.errors,
        crossLineupErrors
    };
}
}),
"[project]/src/app/api/lineups/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/server/clerkClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/name-resolver.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation.ts [app-route] (ecmascript)");
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
        const gameweekId = searchParams.get('gameweekId');
        if (!gameweekId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'gameweekId is required'
            }, {
                status: 400
            });
        }
        // Get user record, create if doesn't exist
        let { data: userRecord } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, email').eq('clerk_id', userId).single();
        if (!userRecord) {
            console.log('Lineup API - User not found in database, creating...');
            try {
                // Fetch user from Clerk
                const client = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clerkClient"])();
                const clerkUser = await client.users.getUser(userId);
                const email = clerkUser.emailAddresses[0]?.emailAddress || '';
                const { firstName, lastName } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveUserNames"])({
                    email,
                    first_name: clerkUser.firstName || undefined,
                    last_name: clerkUser.lastName || undefined,
                    username: clerkUser.username || undefined
                });
                // Create user in Supabase
                const { data: newUser, error: insertError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').insert({
                    clerk_id: userId,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    is_admin: clerkUser.publicMetadata?.isAdmin === true
                }).select('id, email').single();
                if (insertError) {
                    console.error('Error creating user in database:', insertError);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Failed to create user in database'
                    }, {
                        status: 500
                    });
                }
                userRecord = newUser;
                console.log('Lineup API - User created successfully:', userRecord);
            } catch (clerkError) {
                console.error('Error fetching user from Clerk:', clerkError);
                // Fallback: create user with minimal information
                const fallbackEmail = userId.includes('@') ? userId : `${userId}@unknown.com`;
                console.log('Lineup API - Creating user with fallback info, email:', fallbackEmail);
                const { data: newUser, error: insertError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').insert({
                    clerk_id: userId,
                    email: fallbackEmail,
                    first_name: 'User',
                    last_name: '',
                    is_admin: false
                }).select('id, email').single();
                if (insertError) {
                    console.error('Error creating fallback user in database:', insertError);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Failed to create user'
                    }, {
                        status: 500
                    });
                }
                userRecord = newUser;
                console.log('Lineup API - Fallback user created successfully:', userRecord);
            }
        }
        // Get lineup for this manager and gameweek
        const { data: lineup, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('lineups').select(`
        *,
        gameweek:gameweeks(*)
      `).eq('manager_id', userRecord.id).eq('gameweek_id', gameweekId).single();
        if (error && error.code !== 'PGRST116') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: error.message
            }, {
                status: 500
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            lineup: lineup || null
        });
    } catch (error) {
        console.error('Error fetching lineup:', error);
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
        const { gameweekId, playerIds } = await request.json();
        if (!gameweekId || !Array.isArray(playerIds)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'gameweekId and playerIds array are required'
            }, {
                status: 400
            });
        }
        // Get user record, create if doesn't exist
        let { data: userRecord } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, email').eq('clerk_id', userId).single();
        if (!userRecord) {
            console.log('Lineup API - User not found in database, creating...');
            try {
                // Fetch user from Clerk
                const client = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clerkClient"])();
                const clerkUser = await client.users.getUser(userId);
                const email = clerkUser.emailAddresses[0]?.emailAddress || '';
                const { firstName, lastName } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveUserNames"])({
                    email,
                    first_name: clerkUser.firstName || undefined,
                    last_name: clerkUser.lastName || undefined,
                    username: clerkUser.username || undefined
                });
                // Create user in Supabase
                const { data: newUser, error: insertError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').insert({
                    clerk_id: userId,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    is_admin: clerkUser.publicMetadata?.isAdmin === true
                }).select('id, email').single();
                if (insertError) {
                    console.error('Error creating user in database:', insertError);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Failed to create user in database'
                    }, {
                        status: 500
                    });
                }
                userRecord = newUser;
                console.log('Lineup API - User created successfully:', userRecord);
            } catch (clerkError) {
                console.error('Error fetching user from Clerk:', clerkError);
                // Fallback: create user with minimal information
                const fallbackEmail = userId.includes('@') ? userId : `${userId}@unknown.com`;
                console.log('Lineup API - Creating user with fallback info, email:', fallbackEmail);
                const { data: newUser, error: insertError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').insert({
                    clerk_id: userId,
                    email: fallbackEmail,
                    first_name: 'User',
                    last_name: '',
                    is_admin: false
                }).select('id, email').single();
                if (insertError) {
                    console.error('Error creating fallback user in database:', insertError);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Failed to create user'
                    }, {
                        status: 500
                    });
                }
                userRecord = newUser;
                console.log('Lineup API - Fallback user created successfully:', userRecord);
            }
        }
        // Check if gameweek is locked and get league info
        const { data: gameweek } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('gameweeks').select(`
        lock_date,
        league_id,
        leagues:league_id (
          name
        )
      `).eq('id', gameweekId).single();
        if (!gameweek) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Gameweek not found'
            }, {
                status: 404
            });
        }
        if (new Date() > new Date(gameweek.lock_date)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Cannot modify lineup after lock date'
            }, {
                status: 400
            });
        }
        const leagueName = gameweek.leagues?.name;
        // Validate lineup if playerIds provided
        if (playerIds.length > 0) {
            // Get player details for validation
            // CRITICAL: Filter by league to prevent cross-league player confusion
            const { data: players } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('players').select('*').in('id', playerIds).eq('league', leagueName);
            if (players) {
                const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateLineup"])(players);
                if (!validation.isValid) {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: validation.errors.join(', ')
                    }, {
                        status: 400
                    });
                }
            }
        }
        // Create or update lineup
        const { data: lineup, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('lineups').upsert({
            manager_id: userRecord.id,
            gameweek_id: gameweekId,
            player_ids: playerIds,
            is_locked: false,
            total_goals: 0
        }, {
            onConflict: 'manager_id,gameweek_id'
        }).select('*').single();
        if (error) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: error.message
            }, {
                status: 500
            });
        }
        // Log lineup change to history table
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('lineup_history').insert({
            manager_id: userRecord.id,
            gameweek_id: gameweekId,
            player_ids: playerIds,
            created_by_admin: false,
            admin_creator_id: null
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            lineup
        });
    } catch (error) {
        console.error('Error creating/updating lineup:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6ece9db9._.js.map