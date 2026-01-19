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
"[project]/src/utils/placeholder-formatter.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Format placeholder for display (client-safe utility)
 * Supports multiple formats:
 * - Group short: "A1" → { full: "Winner Group A", short: "A1" }
 * - Group long: "winner_group_A" → { full: "Winner Group A", short: "A1" }
 * - Knockout: "QF1" → { full: "Zwycięzca Ćwierćfinału #1", short: "QF1" }
 * - Knockout: "SF1" → { full: "Zwycięzca Półfinału #1", short: "SF1" }
 */ __turbopack_context__.s([
    "formatPlaceholder",
    ()=>formatPlaceholder
]);
function formatPlaceholder(placeholder) {
    // Knockout stage format: QF1, QF2, SF1, SF2
    const knockoutMatch = placeholder.match(/^(QF|SF)(\d+)$/i);
    if (knockoutMatch) {
        const stagePrefix = knockoutMatch[1].toUpperCase();
        const matchNumber = knockoutMatch[2];
        const stageNameMap = {
            'QF': 'Ćwierćfinału',
            'SF': 'Półfinału'
        };
        const stageName = stageNameMap[stagePrefix] || stagePrefix;
        return {
            full: `Zwycięzca ${stageName} #${matchNumber}`,
            short: `${stagePrefix}${matchNumber}`
        };
    }
    // Short group format: A1, B2, etc.
    const shortMatch = placeholder.match(/^([A-Z])([12])$/i);
    if (shortMatch) {
        const group = shortMatch[1].toUpperCase();
        const position = shortMatch[2];
        const positionText = position === '1' ? 'Winner' : 'Runner-up';
        return {
            full: `${positionText} Group ${group}`,
            short: `${group}${position}`
        };
    }
    // Long group format: winner_group_A, runner_up_group_B
    const winnerMatch = placeholder.match(/^winner_group_([A-Z])$/i);
    const runnerUpMatch = placeholder.match(/^runner_up_group_([A-Z])$/i);
    if (winnerMatch) {
        const group = winnerMatch[1].toUpperCase();
        return {
            full: `Winner Group ${group}`,
            short: `${group}1`
        };
    }
    if (runnerUpMatch) {
        const group = runnerUpMatch[1].toUpperCase();
        return {
            full: `Runner-up Group ${group}`,
            short: `${group}2`
        };
    }
    return {
        full: placeholder,
        short: placeholder
    };
}
}),
"[project]/src/utils/knockout-resolver.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getQualifiedTeams",
    ()=>getQualifiedTeams,
    "resolveMatchPairings",
    ()=>resolveMatchPairings,
    "resolveMatchTeam",
    ()=>resolveMatchTeam,
    "resolveMatches",
    ()=>resolveMatches,
    "resolvePlaceholder",
    ()=>resolvePlaceholder,
    "validateGroupStageComplete",
    ()=>validateGroupStageComplete
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
/**
 * Format placeholder for display
 * Re-exported from placeholder-formatter for backward compatibility
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$placeholder$2d$formatter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/placeholder-formatter.ts [app-route] (ecmascript)");
;
async function getQualifiedTeams(cupId) {
    try {
        const { data: standings, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_group_standings').select(`
        manager_id,
        group_name,
        position,
        points,
        qualified,
        users:manager_id (
          id,
          first_name,
          last_name,
          email
        )
      `).eq('cup_id', cupId).eq('qualified', true).order('group_name', {
            ascending: true
        }).order('position', {
            ascending: true
        });
        if (error) {
            return {
                teams: [],
                error: error.message
            };
        }
        const teams = (standings || []).map((s)=>({
                managerId: s.manager_id,
                managerName: s.users?.first_name ? `${s.users.first_name} ${s.users.last_name || ''}`.trim() : s.users?.email || 'Unknown',
                groupName: s.group_name,
                position: s.position,
                points: s.points,
                qualified: s.qualified
            }));
        return {
            teams
        };
    } catch (error) {
        return {
            teams: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function resolvePlaceholder(placeholder, cupId) {
    // If it's already a UUID, return it
    if (placeholder.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return {
            managerId: placeholder
        };
    }
    // Parse knockout stage format: "QF1", "QF2", "SF1", "SF2"
    const knockoutMatch = placeholder.match(/^(QF|SF)(\d+)$/i);
    if (knockoutMatch) {
        const stagePrefix = knockoutMatch[1].toUpperCase();
        const matchNumber = parseInt(knockoutMatch[2]);
        // Map prefix to stage
        const stageMap = {
            'QF': 'quarter_final',
            'SF': 'semi_final'
        };
        const stage = stageMap[stagePrefix];
        if (!stage) {
            return {
                managerId: null,
                error: `Invalid knockout stage prefix: ${stagePrefix}. Expected QF or SF`
            };
        }
        try {
            // Look up the winner of the specified knockout match
            // We look at both legs to find the winner_id
            const { data: matches, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').select('winner_id, match_number').eq('cup_id', cupId).eq('stage', stage).eq('match_number', matchNumber).not('winner_id', 'is', null).limit(1);
            if (error || !matches || matches.length === 0) {
                return {
                    managerId: null,
                    error: `No winner found for ${placeholder}. The match may not be completed yet.`
                };
            }
            return {
                managerId: matches[0].winner_id
            };
        } catch (error) {
            return {
                managerId: null,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Parse short group format: "A1" (winner of group A), "B2" (runner-up of group B)
    const shortMatch = placeholder.match(/^([A-Z])([12])$/i);
    // Parse long group format: "winner_group_A" or "runner_up_group_B"
    const winnerMatch = placeholder.match(/^winner_group_([A-Z])$/i);
    const runnerUpMatch = placeholder.match(/^runner_up_group_([A-Z])$/i);
    let groupName;
    let position;
    if (shortMatch) {
        // Short format: A1, B2, etc.
        groupName = shortMatch[1].toUpperCase();
        position = parseInt(shortMatch[2]);
    } else if (winnerMatch || runnerUpMatch) {
        // Long format: winner_group_A, runner_up_group_B
        groupName = (winnerMatch?.[1] || runnerUpMatch?.[1] || '').toUpperCase();
        position = winnerMatch ? 1 : 2;
    } else {
        return {
            managerId: null,
            error: `Invalid placeholder format: ${placeholder}. Expected "A1", "B2", "QF1", "SF1" or "winner_group_X", "runner_up_group_X" or UUID`
        };
    }
    try {
        const { data: standing, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_group_standings').select('manager_id').eq('cup_id', cupId).eq('group_name', groupName).eq('position', position).eq('qualified', true).single();
        if (error || !standing) {
            return {
                managerId: null,
                error: `No qualified team found for position ${position} in group ${groupName}`
            };
        }
        return {
            managerId: standing.manager_id
        };
    } catch (error) {
        return {
            managerId: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function resolveMatchPairings(pairings, cupId) {
    const resolved = [];
    const errors = [];
    for (const pairing of pairings){
        const homeResult = await resolvePlaceholder(pairing.homeManager, cupId);
        const awayResult = await resolvePlaceholder(pairing.awayManager, cupId);
        if (homeResult.error) {
            errors.push(`Home team: ${homeResult.error}`);
            continue;
        }
        if (awayResult.error) {
            errors.push(`Away team: ${awayResult.error}`);
            continue;
        }
        if (!homeResult.managerId || !awayResult.managerId) {
            errors.push('Failed to resolve manager IDs');
            continue;
        }
        resolved.push({
            cupGameweekId: pairing.cupGameweekId,
            homeManagerId: homeResult.managerId,
            awayManagerId: awayResult.managerId
        });
    }
    return {
        resolved,
        errors
    };
}
;
async function resolveMatchTeam(managerId, teamSource, cupId) {
    // If manager ID exists, it's already resolved
    if (managerId) {
        const { data: manager } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, first_name, last_name, email').eq('id', managerId).single();
        if (manager) {
            const managerName = `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || manager.email;
            return {
                type: 'resolved',
                managerId: manager.id,
                managerName,
                placeholderText: teamSource ? formatPlaceholder(teamSource).full : managerName,
                placeholderShort: teamSource ? formatPlaceholder(teamSource).short : managerName
            };
        }
    }
    // Try to resolve from placeholder
    if (teamSource) {
        const { managerId: resolvedId } = await resolvePlaceholder(teamSource, cupId);
        if (resolvedId) {
            // Placeholder can now be resolved
            const { data: manager } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').select('id, first_name, last_name, email').eq('id', resolvedId).single();
            if (manager) {
                const managerName = `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || manager.email;
                return {
                    type: 'resolved',
                    managerId: manager.id,
                    managerName,
                    placeholderText: formatPlaceholder(teamSource).full,
                    placeholderShort: formatPlaceholder(teamSource).short
                };
            }
        }
        // Placeholder can't be resolved yet - return placeholder text
        const formatted = formatPlaceholder(teamSource);
        return {
            type: 'placeholder',
            placeholderText: formatted.full,
            placeholderShort: formatted.short
        };
    }
    // Shouldn't happen due to DB constraint, but handle gracefully
    return {
        type: 'placeholder',
        placeholderText: 'TBD',
        placeholderShort: 'TBD'
    };
}
async function resolveMatches(matches, cupId) {
    const resolved = await Promise.all(matches.map(async (match)=>({
            ...match,
            resolvedHome: await resolveMatchTeam(match.home_manager_id, match.home_team_source, cupId),
            resolvedAway: await resolveMatchTeam(match.away_manager_id, match.away_team_source, cupId)
        })));
    return resolved;
}
async function validateGroupStageComplete(cupId) {
    try {
        // Check if cup exists and is in correct stage
        const { data: cup, error: cupError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').select('stage').eq('id', cupId).single();
        if (cupError || !cup) {
            return {
                isComplete: false,
                error: 'Cup not found'
            };
        }
        // Group stage must be completed before knockout draw
        if (cup.stage === 'group_stage') {
            // Check if all group stage matches are completed
            const { data: matches, error: matchError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').select('id, is_completed').eq('cup_id', cupId).eq('stage', 'group_stage');
            if (matchError) {
                return {
                    isComplete: false,
                    error: matchError.message
                };
            }
            const allCompleted = matches?.every((m)=>m.is_completed) || false;
            if (!allCompleted) {
                return {
                    isComplete: false,
                    error: 'Not all group stage matches are completed'
                };
            }
        }
        // Check if standings exist and qualified teams are marked
        const { data: standings, error: standingsError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_group_standings').select('qualified').eq('cup_id', cupId).eq('qualified', true);
        if (standingsError) {
            return {
                isComplete: false,
                error: standingsError.message
            };
        }
        if (!standings || standings.length === 0) {
            return {
                isComplete: false,
                error: 'No qualified teams found. Please calculate standings first.'
            };
        }
        return {
            isComplete: true
        };
    } catch (error) {
        return {
            isComplete: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
}),
"[project]/src/app/api/admin/cups/[id]/knockout-draw/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth-helpers.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$knockout$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/utils/knockout-resolver.ts [app-route] (ecmascript) <locals>");
;
;
;
;
;
async function POST(request, context) {
    try {
        const { userId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const { id: cupId } = await context.params;
        // Get cup and verify it exists
        const { data: cup, error: cupError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').select('id, league_id, stage').eq('id', cupId).single();
        if (cupError || !cup) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Cup not found'
            }, {
                status: 404
            });
        }
        // Verify user is admin of the league
        const { isAdmin, error: authError } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyLeagueAdmin"])(userId, cup.league_id);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: authError || 'Forbidden'
            }, {
                status: 403
            });
        }
        const body = await request.json();
        if (!body.stage || !body.matches || !Array.isArray(body.matches)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing required fields: stage, matches'
            }, {
                status: 400
            });
        }
        // Validate stage
        const validKnockoutStages = [
            'round_of_16',
            'quarter_final',
            'semi_final',
            'final'
        ];
        if (!validKnockoutStages.includes(body.stage)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Invalid knockout stage. Must be one of: ${validKnockoutStages.join(', ')}`
            }, {
                status: 400
            });
        }
        // NOTE: We no longer validate group stage completion - allow pre-configuration!
        // Get cup gameweeks for this stage
        const { data: cupGameweeks, error: gameweeksError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_gameweeks').select('id, cup_week, leg').eq('cup_id', cupId).eq('stage', body.stage).order('leg', {
            ascending: true
        });
        if (gameweeksError || !cupGameweeks || cupGameweeks.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `No cup gameweeks found for stage ${body.stage}. Please ensure cup gameweeks are set up.`
            }, {
                status: 400
            });
        }
        // Create a map of cup_gameweek_id to gameweek data
        const gameweekMap = new Map(cupGameweeks.map((gw)=>[
                gw.id,
                gw
            ]));
        // Validate all specified cup gameweek IDs exist
        const invalidGameweeks = body.matches.filter((m)=>!gameweekMap.has(m.cupGameweekId));
        if (invalidGameweeks.length > 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Some cup gameweek IDs are invalid',
                details: invalidGameweeks.map((m)=>m.cupGameweekId)
            }, {
                status: 400
            });
        }
        // Check if matches already exist for this stage
        const { data: existingMatches } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').select('id').eq('cup_id', cupId).eq('stage', body.stage).limit(1);
        if (existingMatches && existingMatches.length > 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Matches for ${body.stage} already exist. Delete them first if you want to recreate.`
            }, {
                status: 400
            });
        }
        // Determine if this stage has two legs (all stages except final)
        const isTwoLegged = body.stage !== 'final';
        // Get leg 1 and leg 2 gameweeks
        const leg1Gameweek = cupGameweeks.find((gw)=>gw.leg === 1);
        const leg2Gameweek = cupGameweeks.find((gw)=>gw.leg === 2);
        if (!leg1Gameweek) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `No leg 1 gameweek found for stage ${body.stage}`
            }, {
                status: 400
            });
        }
        if (isTwoLegged && !leg2Gameweek) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `No leg 2 gameweek found for stage ${body.stage}. Two-legged ties require both legs to be configured.`
            }, {
                status: 400
            });
        }
        // Create matches for both legs (or just leg 1 for finals)
        // Assign match numbers for knockout stages (QF1, QF2, SF1, SF2, etc.)
        const matchesWithResolution = await Promise.all(body.matches.flatMap(async (pairing, index)=>{
            // Try to resolve, but allow null if not yet qualified
            const homeResolution = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$knockout$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["resolvePlaceholder"])(pairing.homeManager, cupId);
            const awayResolution = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$knockout$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["resolvePlaceholder"])(pairing.awayManager, cupId);
            // Match number is 1-indexed (QF1, QF2, QF3, QF4)
            const matchNumber = index + 1;
            const matches = [
                // Leg 1
                {
                    cup_id: cupId,
                    cup_gameweek_id: leg1Gameweek.id,
                    home_manager_id: homeResolution.managerId || null,
                    away_manager_id: awayResolution.managerId || null,
                    home_team_source: pairing.homeManager,
                    away_team_source: pairing.awayManager,
                    stage: body.stage,
                    leg: 1,
                    match_number: matchNumber,
                    group_name: null,
                    is_completed: false
                }
            ];
            // Add leg 2 for two-legged ties (with home/away reversed)
            if (isTwoLegged && leg2Gameweek) {
                matches.push({
                    cup_id: cupId,
                    cup_gameweek_id: leg2Gameweek.id,
                    home_manager_id: awayResolution.managerId || null,
                    away_manager_id: homeResolution.managerId || null,
                    home_team_source: pairing.awayManager,
                    away_team_source: pairing.homeManager,
                    stage: body.stage,
                    leg: 2,
                    match_number: matchNumber,
                    group_name: null,
                    is_completed: false
                });
            }
            return matches;
        }));
        // Flatten the array since flatMap with async doesn't work as expected
        const matchesToInsert = (await Promise.all(matchesWithResolution)).flat();
        const { data: createdMatches, error: insertError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').insert(matchesToInsert).select();
        if (insertError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to create matches',
                details: insertError.message
            }, {
                status: 500
            });
        }
        // Update cup stage if needed
        const stageOrder = [
            'group_stage',
            'round_of_16',
            'quarter_final',
            'semi_final',
            'final'
        ];
        const currentStageIndex = stageOrder.indexOf(cup.stage);
        const newStageIndex = stageOrder.indexOf(body.stage);
        if (newStageIndex > currentStageIndex) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').update({
                stage: body.stage
            }).eq('id', cupId);
        }
        // If this is semi-finals, automatically create the final match (SF1 vs SF2)
        let finalMatch = null;
        if (body.stage === 'semi_final') {
            // Get the final gameweek
            const { data: finalGameweeks } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_gameweeks').select('id, leg').eq('cup_id', cupId).eq('stage', 'final').order('leg', {
                ascending: true
            });
            if (finalGameweeks && finalGameweeks.length > 0) {
                // Finals are single-leg, so just get leg 1
                const finalGameweek = finalGameweeks.find((gw)=>gw.leg === 1);
                if (finalGameweek) {
                    // Create the final match: SF1 vs SF2
                    const { data: createdFinal } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').insert({
                        cup_id: cupId,
                        cup_gameweek_id: finalGameweek.id,
                        home_manager_id: null,
                        away_manager_id: null,
                        home_team_source: 'SF1',
                        away_team_source: 'SF2',
                        stage: 'final',
                        leg: 1,
                        match_number: 1,
                        group_name: null,
                        is_completed: false
                    }).select().single();
                    finalMatch = createdFinal;
                }
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: `Successfully created ${createdMatches.length} matches for ${body.stage}${finalMatch ? ' and auto-created the final' : ''}`,
            matches: createdMatches,
            finalMatch,
            stats: {
                stage: body.stage,
                matchesCreated: createdMatches.length,
                legsPerTie: body.stage === 'final' ? 1 : 2
            }
        });
    } catch (error) {
        console.error('Error creating knockout draw:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
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
        const { id: cupId } = await context.params;
        // Get cup and verify access
        const { data: cup } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').select('id, league_id').eq('id', cupId).single();
        if (!cup) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Cup not found'
            }, {
                status: 404
            });
        }
        const { isAdmin } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyLeagueAdmin"])(userId, cup.league_id);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Forbidden'
            }, {
                status: 403
            });
        }
        // Fetch all knockout matches
        const { data: matches } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').select('*').eq('cup_id', cupId).neq('stage', 'group_stage').order('stage').order('leg');
        if (!matches || matches.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                stages: []
            });
        }
        // Group by stage and calculate stats
        const stageMap = new Map();
        for (const match of matches){
            if (!stageMap.has(match.stage)) {
                stageMap.set(match.stage, {
                    stage: match.stage,
                    matchesCount: 0,
                    totalCount: 0,
                    resolvedCount: 0,
                    completedCount: 0
                });
            }
            const stageInfo = stageMap.get(match.stage);
            stageInfo.matchesCount++;
            stageInfo.totalCount += 2; // Each match has 2 teams
            if (match.home_manager_id) stageInfo.resolvedCount++;
            if (match.away_manager_id) stageInfo.resolvedCount++;
            if (match.is_completed) stageInfo.completedCount++;
        }
        const stages = Array.from(stageMap.values());
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            stages
        });
    } catch (error) {
        console.error('Error fetching knockout stages:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, {
            status: 500
        });
    }
}
async function PUT(request, context) {
    try {
        const { userId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$app$2d$router$2f$server$2f$auth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
        if (!userId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const { id: cupId } = await context.params;
        // Get cup and verify access
        const { data: cup } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').select('id, league_id').eq('id', cupId).single();
        if (!cup) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Cup not found'
            }, {
                status: 404
            });
        }
        const { isAdmin } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyLeagueAdmin"])(userId, cup.league_id);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Forbidden'
            }, {
                status: 403
            });
        }
        const body = await request.json();
        if (!body.stage || !body.matches || !Array.isArray(body.matches)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing required fields: stage, matches'
            }, {
                status: 400
            });
        }
        // Check if any matches have results
        const { data: existingMatches } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').select('id, is_completed, home_score, away_score').eq('cup_id', cupId).eq('stage', body.stage);
        const hasResults = existingMatches?.some((m)=>m.home_score !== null || m.away_score !== null) || false;
        // Delete existing matches for this stage
        const { error: deleteError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').delete().eq('cup_id', cupId).eq('stage', body.stage);
        if (deleteError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to delete existing matches',
                details: deleteError.message
            }, {
                status: 500
            });
        }
        // Get cup gameweeks for this stage
        const { data: cupGameweeks } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_gameweeks').select('id, cup_week, leg').eq('cup_id', cupId).eq('stage', body.stage).order('leg', {
            ascending: true
        });
        if (!cupGameweeks || cupGameweeks.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `No cup gameweeks found for stage ${body.stage}`
            }, {
                status: 400
            });
        }
        // Determine if this stage has two legs (all stages except final)
        const isTwoLegged = body.stage !== 'final';
        // Get leg 1 and leg 2 gameweeks
        const leg1Gameweek = cupGameweeks.find((gw)=>gw.leg === 1);
        const leg2Gameweek = cupGameweeks.find((gw)=>gw.leg === 2);
        if (!leg1Gameweek) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `No leg 1 gameweek found for stage ${body.stage}`
            }, {
                status: 400
            });
        }
        if (isTwoLegged && !leg2Gameweek) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `No leg 2 gameweek found for stage ${body.stage}. Two-legged ties require both legs to be configured.`
            }, {
                status: 400
            });
        }
        // Create new matches with updated placeholders for both legs
        // Assign match numbers for knockout stages (QF1, QF2, SF1, SF2, etc.)
        const matchesWithResolution = await Promise.all(body.matches.flatMap(async (pairing, index)=>{
            const homeResolution = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$knockout$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["resolvePlaceholder"])(pairing.homeManager, cupId);
            const awayResolution = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$knockout$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["resolvePlaceholder"])(pairing.awayManager, cupId);
            // Match number is 1-indexed (QF1, QF2, QF3, QF4)
            const matchNumber = index + 1;
            const matches = [
                // Leg 1
                {
                    cup_id: cupId,
                    cup_gameweek_id: leg1Gameweek.id,
                    home_manager_id: homeResolution.managerId || null,
                    away_manager_id: awayResolution.managerId || null,
                    home_team_source: pairing.homeManager,
                    away_team_source: pairing.awayManager,
                    stage: body.stage,
                    leg: 1,
                    match_number: matchNumber,
                    group_name: null,
                    is_completed: false
                }
            ];
            // Add leg 2 for two-legged ties (with home/away reversed)
            if (isTwoLegged && leg2Gameweek) {
                matches.push({
                    cup_id: cupId,
                    cup_gameweek_id: leg2Gameweek.id,
                    home_manager_id: awayResolution.managerId || null,
                    away_manager_id: homeResolution.managerId || null,
                    home_team_source: pairing.awayManager,
                    away_team_source: pairing.homeManager,
                    stage: body.stage,
                    leg: 2,
                    match_number: matchNumber,
                    group_name: null,
                    is_completed: false
                });
            }
            return matches;
        }));
        // Flatten the array since flatMap with async doesn't work as expected
        const matchesToInsert = (await Promise.all(matchesWithResolution)).flat();
        const { data: createdMatches, error: insertError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').insert(matchesToInsert).select();
        if (insertError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to create updated matches',
                details: insertError.message
            }, {
                status: 500
            });
        }
        // If this is semi-finals, automatically create/update the final match (SF1 vs SF2)
        let finalMatch = null;
        if (body.stage === 'semi_final') {
            // First, delete any existing final
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').delete().eq('cup_id', cupId).eq('stage', 'final');
            // Get the final gameweek
            const { data: finalGameweeks } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_gameweeks').select('id, leg').eq('cup_id', cupId).eq('stage', 'final').order('leg', {
                ascending: true
            });
            if (finalGameweeks && finalGameweeks.length > 0) {
                // Finals are single-leg, so just get leg 1
                const finalGameweek = finalGameweeks.find((gw)=>gw.leg === 1);
                if (finalGameweek) {
                    // Create the final match: SF1 vs SF2
                    const { data: createdFinal } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').insert({
                        cup_id: cupId,
                        cup_gameweek_id: finalGameweek.id,
                        home_manager_id: null,
                        away_manager_id: null,
                        home_team_source: 'SF1',
                        away_team_source: 'SF2',
                        stage: 'final',
                        leg: 1,
                        match_number: 1,
                        group_name: null,
                        is_completed: false
                    }).select().single();
                    finalMatch = createdFinal;
                }
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: `Successfully updated ${createdMatches.length} matches for ${body.stage}${finalMatch ? ' and auto-created the final' : ''}`,
            matches: createdMatches,
            finalMatch,
            hadResults: hasResults,
            warning: hasResults ? 'Previous results were deleted' : null
        });
    } catch (error) {
        console.error('Error updating knockout draw:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
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
        const { id: cupId } = await context.params;
        const searchParams = request.nextUrl.searchParams;
        const stage = searchParams.get('stage');
        if (!stage) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing required parameter: stage'
            }, {
                status: 400
            });
        }
        // Get cup and verify access
        const { data: cup } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cups').select('id, league_id').eq('id', cupId).single();
        if (!cup) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Cup not found'
            }, {
                status: 404
            });
        }
        const { isAdmin } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyLeagueAdmin"])(userId, cup.league_id);
        if (!isAdmin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Forbidden'
            }, {
                status: 403
            });
        }
        // Check if stage has completed matches
        const { data: existingMatches } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').select('id, is_completed, home_score, away_score').eq('cup_id', cupId).eq('stage', stage);
        if (!existingMatches || existingMatches.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `No matches found for stage ${stage}`
            }, {
                status: 404
            });
        }
        const hasResults = existingMatches.some((m)=>m.home_score !== null || m.away_score !== null);
        const confirmed = searchParams.get('confirmed') === 'true';
        if (hasResults && !confirmed) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Stage has completed matches with results',
                requiresConfirmation: true,
                matchesWithResults: existingMatches.filter((m)=>m.home_score !== null || m.away_score !== null).length
            }, {
                status: 400
            });
        }
        // Delete matches
        const { error: deleteError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').delete().eq('cup_id', cupId).eq('stage', stage);
        if (deleteError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to delete matches',
                details: deleteError.message
            }, {
                status: 500
            });
        }
        // If deleting semi-finals, also delete the auto-created final
        let finalDeleted = false;
        if (stage === 'semi_final') {
            const { error: finalDeleteError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('cup_matches').delete().eq('cup_id', cupId).eq('stage', 'final');
            if (!finalDeleteError) {
                finalDeleted = true;
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: `Successfully deleted ${existingMatches.length} matches for ${stage}${finalDeleted ? ' and the auto-created final' : ''}`,
            deletedCount: existingMatches.length
        });
    } catch (error) {
        console.error('Error deleting knockout stage:', error);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__519ea716._.js.map