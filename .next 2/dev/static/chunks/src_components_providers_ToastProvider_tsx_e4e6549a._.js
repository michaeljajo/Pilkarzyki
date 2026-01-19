(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/providers/ToastProvider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ToastProvider",
    ()=>ToastProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-hot-toast/dist/index.mjs [app-client] (ecmascript)");
'use client';
;
;
function ToastProvider() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Toaster"], {
        position: "bottom-right",
        toastOptions: {
            duration: 4000,
            style: {
                background: 'var(--midnight-navy)',
                color: 'var(--off-white)',
                border: '1px solid var(--navy-border)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-4)',
                boxShadow: 'var(--shadow-xl)',
                backdropFilter: 'blur(var(--blur-lg))'
            },
            success: {
                iconTheme: {
                    primary: '#10B981',
                    secondary: '#ffffff'
                },
                style: {
                    background: '#10B981',
                    border: '1px solid #059669',
                    color: '#ffffff',
                    fontWeight: '500'
                }
            },
            error: {
                iconTheme: {
                    primary: 'var(--danger)',
                    secondary: 'var(--off-white)'
                },
                style: {
                    border: '1px solid var(--danger)'
                }
            },
            loading: {
                iconTheme: {
                    primary: 'var(--mineral-green)',
                    secondary: 'var(--off-white)'
                }
            }
        }
    }, void 0, false, {
        fileName: "[project]/src/components/providers/ToastProvider.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
_c = ToastProvider;
var _c;
__turbopack_context__.k.register(_c, "ToastProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_providers_ToastProvider_tsx_e4e6549a._.js.map