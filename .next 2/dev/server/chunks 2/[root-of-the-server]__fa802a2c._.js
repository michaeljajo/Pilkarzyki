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
"[project]/src/app/api/users/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
;
;
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
        const client = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clerkClient"])();
        // Fetch ALL users by setting a high limit (Clerk max is 500 per request)
        const users = await client.users.getUserList({
            limit: 500
        });
        console.log('🔍 Raw Clerk users response:', {
            totalCount: users.totalCount,
            dataLength: users.data.length,
            users: users.data.map((user)=>({
                    id: user.id,
                    email: user.emailAddresses[0]?.emailAddress || '',
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    createdAt: user.createdAt,
                    lastSignInAt: user.lastSignInAt
                }))
        });
        // Check for email duplicates in raw data
        const emailCounts = users.data.reduce((acc, user)=>{
            const email = user.emailAddresses[0]?.emailAddress || '';
            acc[email] = (acc[email] || 0) + 1;
            return acc;
        }, {});
        const duplicateEmails = Object.entries(emailCounts).filter(([_, count])=>count > 1);
        if (duplicateEmails.length > 0) {
            console.log('⚠️ Duplicate emails found in Clerk:', duplicateEmails);
            // Log detailed info for duplicates
            duplicateEmails.forEach(([email, count])=>{
                const duplicateUsers = users.data.filter((user)=>user.emailAddresses[0]?.emailAddress === email);
                console.log(`📧 Email ${email} appears ${count} times:`, duplicateUsers.map((user)=>({
                        id: user.id,
                        createdAt: user.createdAt,
                        lastSignInAt: user.lastSignInAt,
                        firstName: user.firstName,
                        lastName: user.lastName
                    })));
            });
        }
        // Deduplicate users by email - keep the most recent/active one
        const deduplicatedUsers = users.data.reduce((acc, user)=>{
            const email = user.emailAddresses[0]?.emailAddress || '';
            if (!email) {
                // Skip users without email
                return acc;
            }
            const existing = acc.find((u)=>u.emailAddresses[0]?.emailAddress === email);
            if (!existing) {
                // First occurrence of this email
                acc.push(user);
            } else {
                // Decide which user to keep based on priority:
                // 1. Most recent sign-in (if available)
                // 2. Most recent creation date
                // 3. User with more complete profile data
                const existingLastSignIn = existing.lastSignInAt ? new Date(existing.lastSignInAt) : new Date(0);
                const currentLastSignIn = user.lastSignInAt ? new Date(user.lastSignInAt) : new Date(0);
                const existingCreated = new Date(existing.createdAt);
                const currentCreated = new Date(user.createdAt);
                const existingCompleteness = (existing.firstName ? 1 : 0) + (existing.lastName ? 1 : 0) + (existing.username ? 1 : 0);
                const currentCompleteness = (user.firstName ? 1 : 0) + (user.lastName ? 1 : 0) + (user.username ? 1 : 0);
                let shouldReplace = false;
                // Priority 1: Most recent sign-in
                if (currentLastSignIn.getTime() > existingLastSignIn.getTime()) {
                    shouldReplace = true;
                } else if (currentLastSignIn.getTime() === existingLastSignIn.getTime()) {
                    // Priority 2: More complete profile
                    if (currentCompleteness > existingCompleteness) {
                        shouldReplace = true;
                    } else if (currentCompleteness === existingCompleteness) {
                        // Priority 3: More recent creation
                        if (currentCreated.getTime() > existingCreated.getTime()) {
                            shouldReplace = true;
                        }
                    }
                }
                if (shouldReplace) {
                    console.log(`🔄 Replacing duplicate user for ${email}:`, {
                        replacing: existing.id,
                        with: user.id,
                        reason: currentLastSignIn.getTime() > existingLastSignIn.getTime() ? 'more recent sign-in' : currentCompleteness > existingCompleteness ? 'more complete profile' : 'more recent creation'
                    });
                    // Replace the existing user
                    const index = acc.findIndex((u)=>u.emailAddresses[0]?.emailAddress === email);
                    acc[index] = user;
                } else {
                    console.log(`⏭️ Keeping existing user for ${email}: ${existing.id} over ${user.id}`);
                }
            }
            return acc;
        }, []);
        console.log(`🧹 Deduplication: ${users.data.length} → ${deduplicatedUsers.length} users`);
        // Transform deduplicated users to match our expected format
        const transformedUsers = deduplicatedUsers.map((user)=>({
                id: user.id,
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                isAdmin: user.publicMetadata?.isAdmin === true,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt)
            }));
        console.log('✅ Final transformed users count:', transformedUsers.length);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            users: transformedUsers
        });
    } catch (error) {
        console.error('Error fetching users:', error);
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
        const { email, firstName, lastName, isAdmin, password } = await request.json();
        const client = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$clerkClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clerkClient"])();
        const newUser = await client.users.createUser({
            emailAddress: [
                email
            ],
            firstName,
            lastName,
            password,
            publicMetadata: {
                isAdmin: isAdmin || false
            }
        });
        const transformedUser = {
            id: newUser.id,
            clerkId: newUser.id,
            email: newUser.emailAddresses[0]?.emailAddress || '',
            firstName: newUser.firstName || '',
            lastName: newUser.lastName || '',
            isAdmin: newUser.publicMetadata?.isAdmin === true,
            createdAt: new Date(newUser.createdAt),
            updatedAt: new Date(newUser.updatedAt)
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            user: transformedUser
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__fa802a2c._.js.map