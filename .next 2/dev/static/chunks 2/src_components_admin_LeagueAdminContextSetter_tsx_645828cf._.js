(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/admin/LeagueAdminContextSetter.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LeagueAdminContextSetter",
    ()=>LeagueAdminContextSetter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$LeagueAdminContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/LeagueAdminContext.tsx [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function LeagueAdminContextSetter({ leagueId, leagueName }) {
    _s();
    const { setLeagueContext } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$LeagueAdminContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLeagueAdmin"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LeagueAdminContextSetter.useEffect": ()=>{
            setLeagueContext(leagueId, leagueName);
            // Cleanup: reset context when component unmounts
            return ({
                "LeagueAdminContextSetter.useEffect": ()=>{
                    setLeagueContext(null, null);
                }
            })["LeagueAdminContextSetter.useEffect"];
        }
    }["LeagueAdminContextSetter.useEffect"], [
        leagueId,
        leagueName,
        setLeagueContext
    ]);
    return null;
}
_s(LeagueAdminContextSetter, "UGWqmMkTrw2QAE03OZ1rmN4qqTw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$LeagueAdminContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLeagueAdmin"]
    ];
});
_c = LeagueAdminContextSetter;
var _c;
__turbopack_context__.k.register(_c, "LeagueAdminContextSetter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_admin_LeagueAdminContextSetter_tsx_645828cf._.js.map