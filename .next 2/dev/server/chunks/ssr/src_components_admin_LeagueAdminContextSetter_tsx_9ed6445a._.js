module.exports = [
"[project]/src/components/admin/LeagueAdminContextSetter.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LeagueAdminContextSetter",
    ()=>LeagueAdminContextSetter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$LeagueAdminContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/LeagueAdminContext.tsx [app-ssr] (ecmascript)");
'use client';
;
;
function LeagueAdminContextSetter({ leagueId, leagueName }) {
    const { setLeagueContext } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$LeagueAdminContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLeagueAdmin"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setLeagueContext(leagueId, leagueName);
        // Cleanup: reset context when component unmounts
        return ()=>{
            setLeagueContext(null, null);
        };
    }, [
        leagueId,
        leagueName,
        setLeagueContext
    ]);
    return null;
}
}),
];

//# sourceMappingURL=src_components_admin_LeagueAdminContextSetter_tsx_9ed6445a._.js.map