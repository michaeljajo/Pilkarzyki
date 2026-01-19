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
"[project]/src/app/api/manager/leagues/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/server/clerkClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/name-resolver.ts [app-route] (ecmascript)");
;
;
;
;
async function GET(request) {
    console.log('GET /api/manager/leagues - endpoint hit! [FIXED]');
    try {
        const { userId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        console.log('GET /api/manager/leagues - userId:', userId);
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        // Check if this is a request for a specific league
        const { searchParams } = new URL(request.url);
        const leagueId = searchParams.get('id');
        if (leagueId) {
            console.log('GET /api/manager/leagues - Fetching specific league:', leagueId);
            return await getSpecificLeague(userId, leagueId);
        }
        // Get user record, create if doesn't exist
        let { data: userRecord } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id').eq('clerk_id', userId).single();
        console.log('GET /api/manager/leagues - userRecord:', userRecord);
        if (!userRecord) {
            console.log('GET /api/manager/leagues - User not found in database, creating...');
            try {
                // Fetch user from Clerk
                const client = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clerkClient"])();
                const clerkUser = await client.users.getUser(userId);
                console.log('GET /api/manager/leagues - Clerk user found:', {
                    id: clerkUser.id,
                    email: clerkUser.emailAddresses[0]?.emailAddress,
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    username: clerkUser.username
                });
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
                }).select('id').single();
                if (insertError) {
                    console.error('Error creating user in database:', insertError);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Failed to create user in database'
                    }, {
                        status: 500
                    });
                }
                userRecord = newUser;
                console.log('GET /api/manager/leagues - User created successfully:', userRecord);
            } catch (clerkError) {
                console.error('Error fetching user from Clerk:', clerkError);
                // Fallback: create user with minimal information
                // Extract email from error message or use clerk ID as fallback
                const fallbackEmail = userId.includes('@') ? userId : `${userId}@unknown.com`;
                console.log('GET /api/manager/leagues - Creating user with fallback info, email:', fallbackEmail);
                const { data: newUser, error: insertError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').insert({
                    clerk_id: userId,
                    email: fallbackEmail,
                    first_name: 'User',
                    last_name: '',
                    is_admin: false
                }).select('id').single();
                if (insertError) {
                    console.error('Error creating fallback user in database:', insertError);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Failed to create user'
                    }, {
                        status: 500
                    });
                }
                userRecord = newUser;
                console.log('GET /api/manager/leagues - Fallback user created successfully:', userRecord);
            }
        }
        // Get leagues where user is assigned as manager (via squads table) OR where user is admin
        const [{ data: participantLeagues, error: participantError }, { data: adminLeagues, error: adminError }] = await Promise.all([
            // Leagues where user participates (has players)
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select(`
          *,
          squads!inner(manager_id)
        `).eq('squads.manager_id', userRecord.id).eq('is_active', true),
            // Leagues where user is admin
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select('*').eq('admin_id', userRecord.id).eq('is_active', true)
        ]);
        console.log('GET /api/manager/leagues - participant leagues:', participantLeagues);
        console.log('GET /api/manager/leagues - admin leagues:', adminLeagues);
        console.log('GET /api/manager/leagues - errors:', {
            participantError,
            adminError
        });
        if (participantError || adminError) {
            console.error('Error fetching manager leagues:', {
                participantError,
                adminError
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to fetch leagues'
            }, {
                status: 500
            });
        }
        // Combine and deduplicate leagues (in case user is both admin and participant)
        const allLeagues = [
            ...participantLeagues || [],
            ...adminLeagues || []
        ];
        const uniqueLeagues = allLeagues.filter((league, index, array)=>array.findIndex((l)=>l.id === league.id) === index);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            leagues: uniqueLeagues
        });
    } catch (error) {
        console.error('Error in manager leagues API:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function getSpecificLeague(userId, leagueId) {
    try {
        console.log('GET /api/manager/leagues specific - Starting with userId:', userId, 'leagueId:', leagueId);
        // Get user information to verify they have access to this league
        const { data: user, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, email, is_admin').eq('clerk_id', userId).single();
        if (userError || !user) {
            console.log('GET /api/manager/leagues specific - User error:', userError);
            console.log('GET /api/manager/leagues specific - User data:', user);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'User not found'
            }, {
                status: 404
            });
        }
        console.log('GET /api/manager/leagues specific - User found:', {
            id: user.id,
            email: user.email,
            is_admin: user.is_admin
        });
        // Get league details
        const { data: league, error: leagueError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select(`
        id,
        name,
        season,
        current_gameweek,
        is_active,
        admin_id,
        created_at,
        updated_at
      `).eq('id', leagueId).single();
        console.log('GET /api/manager/leagues specific - League query result:', {
            league,
            error: leagueError
        });
        if (leagueError || !league) {
            console.log('GET /api/manager/leagues specific - League error details:', JSON.stringify(leagueError));
            console.log('GET /api/manager/leagues specific - League data:', league);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'League not found'
            }, {
                status: 404
            });
        }
        // Check if user has any players in this league (which means they're a participant)
        const { data: userPlayers } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('players').select('id').eq('manager_id', user.id).eq('league', league.name) // Players are assigned by league name
        .limit(1);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            league: {
                id: league.id,
                name: league.name,
                season: league.season,
                current_gameweek: league.current_gameweek,
                is_active: league.is_active,
                created_at: league.created_at,
                updated_at: league.updated_at,
                user_is_participant: userPlayers && userPlayers.length > 0,
                // User is admin if they're the league creator OR a global admin
                user_is_admin: league.admin_id === user.id || user.is_admin === true
            }
        });
    } catch (error) {
        console.error('Error fetching specific league for manager:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__679ab0f5._.js.map