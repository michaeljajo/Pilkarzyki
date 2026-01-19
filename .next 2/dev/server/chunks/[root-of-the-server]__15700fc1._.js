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
"[project]/src/app/api/leagues/[id]/managers/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/name-resolver.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth-helpers.ts [app-route] (ecmascript)");
;
;
;
;
;
async function GET(request, { params }) {
    try {
        const { userId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        const { id } = await params;
        console.log('GET /api/leagues/[id]/managers - userId:', userId, 'leagueId:', id);
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        // Verify user is admin of this league
        const { isAdmin, error: authError } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyLeagueAdmin"])(userId, id);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: authError || 'Forbidden'
            }, {
                status: 403
            });
        }
        // Get managers from squads table with user details
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select(`
        id,
        manager_id,
        users!squads_manager_id_fkey(
          id,
          clerk_id,
          email,
          first_name,
          last_name,
          is_admin,
          created_at
        )
      `).eq('league_id', id);
        console.log('Managers query result:', {
            data,
            error
        });
        if (error) {
            console.error('Error fetching managers:', error);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: error.message
            }, {
                status: 500
            });
        }
        // Transform the data to match expected User interface
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const managers = (data || []).map((squad)=>({
                id: squad.users.clerk_id || squad.users.id,
                clerkId: squad.users.clerk_id,
                databaseId: squad.users.id,
                email: squad.users.email,
                firstName: squad.users.first_name,
                lastName: squad.users.last_name,
                isAdmin: squad.users.is_admin,
                createdAt: new Date(squad.users.created_at),
                updatedAt: new Date(squad.users.created_at) // Using created_at as fallback
            }));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            managers
        });
    } catch (error) {
        console.error('GET managers catch error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function POST(request, { params }) {
    try {
        const { userId: authUserId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        const { id } = await params;
        console.log('POST /api/leagues/[id]/managers - authUserId:', authUserId, 'leagueId:', id);
        if (!authUserId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        // Verify user is admin of this league
        const { isAdmin, error: authError } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyLeagueAdmin"])(authUserId, id);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: authError || 'Forbidden'
            }, {
                status: 403
            });
        }
        const { userId } = await request.json();
        console.log('Adding manager with userId:', userId);
        // Check if league exists
        const { data: league, error: leagueError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select('*').eq('id', id).single();
        if (leagueError || !league) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'League not found'
            }, {
                status: 404
            });
        }
        // Find user by Clerk ID (the userId being sent is actually a Clerk ID)
        const { data: foundUser, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('*').eq('clerk_id', userId).single();
        let user = foundUser;
        // If user doesn't exist in our database, create them
        if (userError || !user) {
            console.log('User not found in database, creating user record for clerkId:', userId);
            // Get user details from Clerk
            const { clerkClient } = await __turbopack_context__.A("[project]/node_modules/@clerk/nextjs/dist/esm/server/index.js [app-route] (ecmascript, async loader)");
            const client = await clerkClient();
            try {
                const clerkUser = await client.users.getUser(userId);
                const email = clerkUser.emailAddresses[0]?.emailAddress || '';
                console.log('🔍 Creating user record for:', email);
                console.log('📝 Clerk user data:', {
                    id: clerkUser.id,
                    email,
                    first_name: clerkUser.firstName,
                    last_name: clerkUser.lastName,
                    username: clerkUser.username
                });
                // Use enhanced name resolution logic
                const { firstName, lastName } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$name$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveUserNames"])({
                    email,
                    first_name: clerkUser.firstName,
                    last_name: clerkUser.lastName,
                    username: clerkUser.username
                });
                // Create user record in our database
                const { data: newUser, error: createError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').insert({
                    clerk_id: userId,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    is_admin: clerkUser.publicMetadata?.isAdmin === true
                }).select('*').single();
                if (createError) {
                    console.error('Error creating user:', createError);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Failed to create user'
                    }, {
                        status: 500
                    });
                }
                user = newUser;
            } catch (clerkError) {
                console.error('Error fetching user from Clerk:', clerkError);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'User not found in Clerk'
                }, {
                    status: 404
                });
            }
        }
        // Check if user is already a manager in this league
        const { data: existingSquad } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('*').eq('league_id', id).eq('manager_id', user.id).single();
        if (existingSquad) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'User is already a manager in this league'
            }, {
                status: 400
            });
        }
        // Create squad for the manager in this league
        const { data: newSquad, error: squadError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').insert({
            league_id: id,
            manager_id: user.id
        }).select('*').single();
        if (squadError) {
            console.error('Error creating squad:', squadError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to add manager to league'
            }, {
                status: 500
            });
        }
        console.log('Successfully added manager:', {
            user,
            squad: newSquad
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            manager: user,
            squad: newSquad
        });
    } catch (error) {
        console.error('POST managers catch error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function DELETE(request, { params }) {
    try {
        const { userId: authUserId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        const { id } = await params;
        console.log('DELETE /api/leagues/[id]/managers - authUserId:', authUserId, 'leagueId:', id);
        if (!authUserId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        // Verify user is admin of this league
        const { isAdmin, error: authError } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyLeagueAdmin"])(authUserId, id);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: authError || 'Forbidden'
            }, {
                status: 403
            });
        }
        const { managerId } = await request.json();
        console.log('Removing manager with managerId:', managerId);
        if (!managerId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Manager ID is required'
            }, {
                status: 400
            });
        }
        // Check if league exists
        const { data: league, error: leagueError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('leagues').select('*').eq('id', id).single();
        if (leagueError || !league) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'League not found'
            }, {
                status: 404
            });
        }
        // Check if manager exists in this league
        const { data: existingSquad, error: squadError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').select('*').eq('league_id', id).eq('manager_id', managerId).single();
        if (squadError || !existingSquad) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Manager not found in this league'
            }, {
                status: 404
            });
        }
        // Remove the manager by deleting their squad record
        const { error: deleteError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('squads').delete().eq('league_id', id).eq('manager_id', managerId);
        if (deleteError) {
            console.error('Error removing manager:', deleteError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to remove manager from league'
            }, {
                status: 500
            });
        }
        console.log('Successfully removed manager:', managerId, 'from league:', id);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: 'Manager removed from league successfully'
        });
    } catch (error) {
        console.error('DELETE managers catch error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__15700fc1._.js.map