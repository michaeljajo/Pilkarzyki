module.exports = [
"[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LeagueResultsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Icon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/Icon.js [app-ssr] (ecmascript) <export default as Icon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trophy.js [app-ssr] (ecmascript) <export default as Trophy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$lucide$2f$lab$2f$dist$2f$esm$2f$icons$2f$soccer$2d$ball$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__soccerBall$3e$__ = __turbopack_context__.i("[project]/node_modules/@lucide/lab/dist/esm/icons/soccer-ball.js [app-ssr] (ecmascript) <export default as soccerBall>");
'use client';
;
;
;
;
;
function LeagueResultsPage() {
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useParams"])();
    const leagueId = params.id;
    const [gameweeks, setGameweeks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [matchData, setMatchData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [cup, setCup] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [cupGameweeks, setCupGameweeks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedGameweek, setSelectedGameweek] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [updatingStatus, setUpdatingStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [playerGoals, setPlayerGoals] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [playerHasPlayed, setPlayerHasPlayed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetchGameweeks();
        fetchCup();
    }, [
        leagueId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (selectedGameweek) {
            fetchMatchData();
            fetchCupMatches();
        } else {
            setMatchData(null);
            setCupGameweeks([]);
            setPlayerGoals({});
            setPlayerHasPlayed({});
        }
    }, [
        selectedGameweek,
        cup
    ]);
    const fetchGameweeks = async ()=>{
        try {
            const response = await fetch('/api/gameweeks');
            if (response.ok) {
                const data = await response.json();
                // Filter gameweeks for this specific league
                const leagueGameweeks = (data.gameweeks || []).filter((gw)=>gw.league_id === leagueId);
                setGameweeks(leagueGameweeks);
                // Auto-select current active gameweek if no gameweek is currently selected
                if (!selectedGameweek && leagueGameweeks.length > 0) {
                    const sortedGameweeks = leagueGameweeks.sort((a, b)=>a.week - b.week);
                    const activeGameweek = sortedGameweeks.find((gw)=>!gw.is_completed);
                    if (activeGameweek) {
                        setSelectedGameweek(activeGameweek.id);
                    } else {
                        const lastGameweek = sortedGameweeks[sortedGameweeks.length - 1];
                        if (lastGameweek) {
                            setSelectedGameweek(lastGameweek.id);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch gameweeks:', error);
        } finally{
            setLoading(false);
        }
    };
    const fetchCup = async ()=>{
        try {
            const response = await fetch(`/api/cups?leagueId=${leagueId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.cup) {
                    setCup(data.cup);
                }
            }
        } catch (error) {
            console.error('Failed to fetch cup:', error);
        }
    };
    const fetchCupMatches = async ()=>{
        if (!cup || !selectedGameweek) return;
        try {
            const response = await fetch(`/api/cups/${cup.id}/results`);
            if (response.ok) {
                const data = await response.json();
                // Find cup gameweeks that match the selected league gameweek
                const matchingCupGameweeks = (data.gameweeks || []).filter((cgw)=>cgw.gameweek?.id === selectedGameweek);
                setCupGameweeks(matchingCupGameweeks);
                // Add cup match players to playerGoals and playerHasPlayed state
                matchingCupGameweeks.forEach((cgw)=>{
                    cgw.matches?.forEach((match)=>{
                        match.home_lineup?.players?.forEach((player)=>{
                            setPlayerGoals((prev)=>({
                                    ...prev,
                                    [player.id]: player.goals_scored || 0
                                }));
                            setPlayerHasPlayed((prev)=>({
                                    ...prev,
                                    [player.id]: player.has_played || false
                                }));
                        });
                        match.away_lineup?.players?.forEach((player)=>{
                            setPlayerGoals((prev)=>({
                                    ...prev,
                                    [player.id]: player.goals_scored || 0
                                }));
                            setPlayerHasPlayed((prev)=>({
                                    ...prev,
                                    [player.id]: player.has_played || false
                                }));
                        });
                    });
                });
            }
        } catch (error) {
            console.error('Failed to fetch cup matches:', error);
        }
    };
    const fetchMatchData = async ()=>{
        if (!selectedGameweek) return;
        try {
            setLoading(true);
            const response = await fetch(`/api/gameweeks/${selectedGameweek}/matches-with-lineups`);
            if (response.ok) {
                const data = await response.json();
                setMatchData(data);
                // Initialize playerGoals and playerHasPlayed state with existing results
                const goalsMap = {};
                const hasPlayedMap = {};
                data.matches?.forEach((match)=>{
                    match.home_lineup?.players?.forEach((player)=>{
                        goalsMap[player.id] = player.goals_scored || 0;
                        hasPlayedMap[player.id] = player.has_played || false;
                    });
                    match.away_lineup?.players?.forEach((player)=>{
                        goalsMap[player.id] = player.goals_scored || 0;
                        hasPlayedMap[player.id] = player.has_played || false;
                    });
                });
                setPlayerGoals(goalsMap);
                setPlayerHasPlayed(hasPlayedMap);
            } else {
                console.error('Failed to fetch match data');
                setMatchData(null);
            }
        } catch (error) {
            console.error('Failed to fetch match data:', error);
            setMatchData(null);
        } finally{
            setLoading(false);
        }
    };
    const handlePlayerGoalsChange = (playerId, value)=>{
        // Allow -1 to 9
        // If value is empty, default to 0
        let goals = 0;
        if (value === '' || value === '-') {
            goals = 0;
        } else {
            const parsed = parseInt(value);
            if (isNaN(parsed)) {
                goals = 0;
            } else {
                // Clamp between -1 and 9
                goals = Math.min(Math.max(parsed, -1), 9);
            }
        }
        setPlayerGoals((prev)=>({
                ...prev,
                [playerId]: goals
            }));
    };
    const handlePlayerGoalsFocus = (e)=>{
        // Select all text when input is focused to allow easy replacement
        e.target.select();
    };
    const updateGameweekStatus = async (isCompleted)=>{
        if (!selectedGameweek || !matchData) return;
        setUpdatingStatus(true);
        try {
            const gameweek = gameweeks.find((gw)=>gw.id === selectedGameweek);
            if (!gameweek) return;
            const response = await fetch(`/api/gameweeks/${selectedGameweek}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    week: gameweek.week,
                    start_date: gameweek.start_date,
                    end_date: gameweek.end_date,
                    lock_date: gameweek.lock_date,
                    is_completed: isCompleted
                })
            });
            if (response.ok) {
                await fetchGameweeks();
                await fetchMatchData();
                alert(`Gameweek marked as ${isCompleted ? 'completed' : 'active'} successfully!`);
            } else {
                const error = await response.json();
                alert(`Error updating gameweek status: ${error.error}`);
            }
        } catch (error) {
            console.error('Failed to update gameweek status:', error);
            alert('Failed to update gameweek status');
        } finally{
            setUpdatingStatus(false);
        }
    };
    const saveAllResults = async ()=>{
        if (!selectedGameweek) return;
        setSaving(true);
        try {
            const results = Object.entries(playerGoals).map(([player_id, goals])=>({
                    player_id,
                    goals,
                    has_played: playerHasPlayed[player_id] || false
                }));
            const response = await fetch(`/api/gameweeks/${selectedGameweek}/lineups`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    results
                })
            });
            if (response.ok) {
                alert('All results saved successfully! Match scores and standings updated.');
                await fetchMatchData();
                await fetchCupMatches();
            } else {
                const error = await response.json();
                alert(`Error saving results: ${error.error}`);
            }
        } catch (error) {
            alert('Failed to save results');
        } finally{
            setSaving(false);
        }
    };
    const saveIndividualMatch = async (matchId)=>{
        if (!selectedGameweek || !matchData) return;
        setSaving(true);
        try {
            // Try to find match in league matches first
            let match = matchData.matches.find((m)=>m.id === matchId);
            // If not found, search in cup matches
            if (!match) {
                for (const cupGameweek of cupGameweeks){
                    const cupMatch = cupGameweek.matches.find((m)=>m.id === matchId);
                    if (cupMatch) {
                        match = cupMatch;
                        break;
                    }
                }
            }
            if (!match) return;
            const matchPlayerIds = [
                ...match.home_lineup?.players?.map((p)=>p.id) || [],
                ...match.away_lineup?.players?.map((p)=>p.id) || []
            ];
            const results = matchPlayerIds.map((playerId)=>({
                    player_id: playerId,
                    goals: playerGoals[playerId] || 0,
                    has_played: playerHasPlayed[playerId] || false
                }));
            const response = await fetch(`/api/gameweeks/${selectedGameweek}/lineups`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    results
                })
            });
            if (response.ok) {
                alert('Match results saved successfully!');
                await fetchMatchData();
                await fetchCupMatches();
            } else {
                const error = await response.json();
                alert(`Error saving match results: ${error.error}`);
            }
        } catch (error) {
            alert('Failed to save match results');
        } finally{
            setSaving(false);
        }
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center h-64",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            }, void 0, false, {
                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                lineNumber: 366,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
            lineNumber: 365,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-7xl mx-auto p-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-2xl font-bold text-gray-900",
                        children: "Results"
                    }, void 0, false, {
                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                        lineNumber: 375,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                    lineNumber: 374,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                lineNumber: 373,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 bg-white rounded-lg border border-gray-200 p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid md:grid-cols-2 gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block text-sm font-medium text-gray-700 mb-1",
                                    children: "Select Gameweek"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                    lineNumber: 383,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    value: selectedGameweek,
                                    onChange: (e)=>setSelectedGameweek(e.target.value),
                                    className: "w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "",
                                            children: "Choose a gameweek..."
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                            lineNumber: 391,
                                            columnNumber: 15
                                        }, this),
                                        gameweeks.map((gameweek)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: gameweek.id,
                                                children: [
                                                    "Week ",
                                                    gameweek.week,
                                                    gameweek.is_completed ? ' (Completed)' : ' (Active)'
                                                ]
                                            }, gameweek.id, true, {
                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                lineNumber: 393,
                                                columnNumber: 17
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                    lineNumber: 386,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                            lineNumber: 382,
                            columnNumber: 11
                        }, this),
                        selectedGameweek && matchData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-end",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: saveAllResults,
                                disabled: saving,
                                className: "w-full px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50",
                                children: saving ? 'Saving...' : 'Save All Results'
                            }, void 0, false, {
                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                lineNumber: 401,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                            lineNumber: 400,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                    lineNumber: 381,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                lineNumber: 380,
                columnNumber: 7
            }, this),
            selectedGameweek && matchData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-blue-50 border border-blue-200 rounded-lg p-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between items-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-base font-semibold text-blue-900",
                                        children: [
                                            matchData.gameweek.leagues?.name,
                                            " - Week ",
                                            matchData.gameweek.week
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                        lineNumber: 420,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                    lineNumber: 419,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        (()=>{
                                            const currentGameweek = gameweeks.find((gw)=>gw.id === selectedGameweek);
                                            const isCompleted = currentGameweek?.is_completed || false;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                value: isCompleted ? 'completed' : 'active',
                                                onChange: (e)=>updateGameweekStatus(e.target.value === 'completed'),
                                                disabled: updatingStatus,
                                                className: "px-3 py-1 text-xs font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "active",
                                                        children: "Active"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                        lineNumber: 436,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "completed",
                                                        children: "Completed"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                        lineNumber: 437,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                lineNumber: 430,
                                                columnNumber: 21
                                            }, this);
                                        })(),
                                        updatingStatus && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                            lineNumber: 442,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                    lineNumber: 424,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                            lineNumber: 418,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                        lineNumber: 417,
                        columnNumber: 11
                    }, this),
                    (()=>{
                        const getManagerDisplayName = (manager)=>{
                            // Priority 1: Team name
                            if (manager?.squad?.team_name) {
                                return manager.squad.team_name;
                            }
                            // Priority 2: First and last name
                            if (manager?.first_name && manager?.last_name) {
                                return `${manager.first_name} ${manager.last_name}`;
                            }
                            // Priority 3: First name only
                            if (manager?.first_name) {
                                return manager.first_name;
                            }
                            // Priority 4: Email
                            return manager?.email || 'Unknown Manager';
                        };
                        // Check if all players have played for a manager
                        const allPlayersHavePlayed = (players)=>{
                            if (!players || players.length === 0) return false;
                            return players.every((p)=>playerHasPlayed[p.id] === true);
                        };
                        // Get name color based on whether all players have played
                        const getManagerNameColor = (players)=>{
                            return allPlayersHavePlayed(players) ? 'text-[#061852]' : 'text-[#2E7D32]';
                        };
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: matchData.matches.length === 0 && cupGameweeks.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center py-16",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-gray-400",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-3xl mb-2",
                                            children: "⚽"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                            lineNumber: 484,
                                            columnNumber: 23
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm",
                                            children: "Brak meczów w tej kolejce"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                            lineNumber: 485,
                                            columnNumber: 23
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                    lineNumber: 483,
                                    columnNumber: 21
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                lineNumber: 482,
                                columnNumber: 19
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-6",
                                children: [
                                    matchData.matches.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-semibold text-gray-800 mb-3",
                                                children: "Mecze Ligowe"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                lineNumber: 493,
                                                columnNumber: 25
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-6",
                                                children: matchData.matches.map((match)=>{
                                                    const homeGoals = match.home_lineup?.players?.reduce((sum, p)=>sum + (playerGoals[p.id] || 0), 0) || 0;
                                                    const awayGoals = match.away_lineup?.players?.reduce((sum, p)=>sum + (playerGoals[p.id] || 0), 0) || 0;
                                                    const homePlayers = match.home_lineup?.players || [];
                                                    const awayPlayers = match.away_lineup?.players || [];
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "bg-white border-2 border-[#29544D] rounded-2xl hover:shadow-lg transition-shadow duration-200",
                                                        style: {
                                                            padding: '20px'
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex justify-end mb-3",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>saveIndividualMatch(match.id),
                                                                    disabled: saving,
                                                                    className: "px-4 py-1 text-sm bg-[#29544D] text-white rounded-lg hover:bg-[#1f3d37] disabled:opacity-50",
                                                                    children: saving ? 'Zapisywanie...' : 'Zapisz wynik'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                    lineNumber: 505,
                                                                    columnNumber: 23
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                lineNumber: 504,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center justify-between mb-3",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "flex-1",
                                                                        style: {
                                                                            paddingRight: '24px'
                                                                        },
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: `text-lg font-semibold ${getManagerNameColor(homePlayers)}`,
                                                                            children: getManagerDisplayName(match.home_manager)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                            lineNumber: 517,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                        lineNumber: 516,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "flex items-center gap-4 px-8",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "text-3xl font-bold text-[#061852]",
                                                                                children: homeGoals
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                lineNumber: 522,
                                                                                columnNumber: 25
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "text-2xl font-medium text-gray-400",
                                                                                children: "-"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                lineNumber: 523,
                                                                                columnNumber: 25
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "text-3xl font-bold text-[#061852]",
                                                                                children: awayGoals
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                lineNumber: 524,
                                                                                columnNumber: 25
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                        lineNumber: 521,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "flex-1 text-right",
                                                                        style: {
                                                                            paddingLeft: '24px'
                                                                        },
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: `text-lg font-semibold ${getManagerNameColor(awayPlayers)}`,
                                                                            children: getManagerDisplayName(match.away_manager)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                            lineNumber: 527,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                        lineNumber: 526,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                lineNumber: 515,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-start justify-between pt-3 border-t-2 border-[#DECF99]",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "flex-1 space-y-1",
                                                                        style: {
                                                                            paddingRight: '32px'
                                                                        },
                                                                        children: homePlayers.length > 0 ? homePlayers.map((player)=>{
                                                                            const goals = playerGoals[player.id] || 0;
                                                                            const hasPlayed = playerHasPlayed[player.id] || false;
                                                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex items-baseline gap-2 h-[20px]",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "checkbox",
                                                                                        checked: hasPlayed,
                                                                                        onChange: (e)=>setPlayerHasPlayed((prev)=>({
                                                                                                    ...prev,
                                                                                                    [player.id]: e.target.checked
                                                                                                })),
                                                                                        disabled: saving,
                                                                                        className: "w-4 h-4 cursor-pointer disabled:cursor-not-allowed",
                                                                                        title: "Oznacz, że zawodnik rozegrał mecz"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                        lineNumber: 543,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "number",
                                                                                        min: "-1",
                                                                                        max: "9",
                                                                                        value: goals,
                                                                                        onChange: (e)=>handlePlayerGoalsChange(player.id, e.target.value),
                                                                                        onFocus: handlePlayerGoalsFocus,
                                                                                        disabled: saving,
                                                                                        className: `w-12 px-1 py-0.5 text-xs text-center border rounded focus:outline-none focus:ring-1 disabled:bg-gray-100 ${goals === -1 ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500' : 'border-gray-300 focus:ring-[#29544D]'}`
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                        lineNumber: 551,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                        className: `text-sm leading-5 ${goals === -1 ? 'font-bold text-red-600' : goals > 0 ? 'font-bold text-[#061852]' : 'text-gray-600'}`,
                                                                                        children: [
                                                                                            player.name,
                                                                                            " ",
                                                                                            player.surname,
                                                                                            goals === -1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                className: "ml-1 text-red-600",
                                                                                                children: "(OG)"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                                lineNumber: 571,
                                                                                                columnNumber: 52
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                        lineNumber: 565,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    goals > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "flex items-center gap-1",
                                                                                        children: Array.from({
                                                                                            length: goals
                                                                                        }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Icon$3e$__["Icon"], {
                                                                                                iconNode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$lucide$2f$lab$2f$dist$2f$esm$2f$icons$2f$soccer$2d$ball$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__soccerBall$3e$__["soccerBall"],
                                                                                                size: 12,
                                                                                                className: "text-[#061852]",
                                                                                                strokeWidth: 2
                                                                                            }, i, false, {
                                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                                lineNumber: 576,
                                                                                                columnNumber: 39
                                                                                            }, this))
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                        lineNumber: 574,
                                                                                        columnNumber: 35
                                                                                    }, this)
                                                                                ]
                                                                            }, player.id, true, {
                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                lineNumber: 542,
                                                                                columnNumber: 31
                                                                            }, this);
                                                                        }) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex items-baseline gap-2 h-[20px]",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                className: "text-sm text-gray-400 italic leading-5",
                                                                                children: "Nie ustawiono składu"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                lineNumber: 585,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                            lineNumber: 584,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                        lineNumber: 536,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "flex-1 text-right space-y-1",
                                                                        style: {
                                                                            paddingLeft: '32px'
                                                                        },
                                                                        children: awayPlayers.length > 0 ? awayPlayers.map((player)=>{
                                                                            const goals = playerGoals[player.id] || 0;
                                                                            const hasPlayed = playerHasPlayed[player.id] || false;
                                                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex items-baseline justify-end gap-2 h-[20px]",
                                                                                children: [
                                                                                    goals > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "flex items-center gap-1",
                                                                                        children: Array.from({
                                                                                            length: goals
                                                                                        }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Icon$3e$__["Icon"], {
                                                                                                iconNode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$lucide$2f$lab$2f$dist$2f$esm$2f$icons$2f$soccer$2d$ball$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__soccerBall$3e$__["soccerBall"],
                                                                                                size: 12,
                                                                                                className: "text-[#061852]",
                                                                                                strokeWidth: 2
                                                                                            }, i, false, {
                                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                                lineNumber: 601,
                                                                                                columnNumber: 39
                                                                                            }, this))
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                        lineNumber: 599,
                                                                                        columnNumber: 35
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                        className: `text-sm leading-5 ${goals === -1 ? 'font-bold text-red-600' : goals > 0 ? 'font-bold text-[#061852]' : 'text-gray-600'}`,
                                                                                        children: [
                                                                                            player.name,
                                                                                            " ",
                                                                                            player.surname,
                                                                                            goals === -1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                className: "ml-1 text-red-600",
                                                                                                children: "(OG)"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                                lineNumber: 611,
                                                                                                columnNumber: 52
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                        lineNumber: 605,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "number",
                                                                                        min: "-1",
                                                                                        max: "9",
                                                                                        value: goals,
                                                                                        onChange: (e)=>handlePlayerGoalsChange(player.id, e.target.value),
                                                                                        onFocus: handlePlayerGoalsFocus,
                                                                                        disabled: saving,
                                                                                        className: `w-12 px-1 py-0.5 text-xs text-center border rounded focus:outline-none focus:ring-1 disabled:bg-gray-100 ${goals === -1 ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500' : 'border-gray-300 focus:ring-[#29544D]'}`
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                        lineNumber: 613,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "checkbox",
                                                                                        checked: hasPlayed,
                                                                                        onChange: (e)=>setPlayerHasPlayed((prev)=>({
                                                                                                    ...prev,
                                                                                                    [player.id]: e.target.checked
                                                                                                })),
                                                                                        disabled: saving,
                                                                                        className: "w-4 h-4 cursor-pointer disabled:cursor-not-allowed",
                                                                                        title: "Oznacz, że zawodnik rozegrał mecz"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                        lineNumber: 627,
                                                                                        columnNumber: 33
                                                                                    }, this)
                                                                                ]
                                                                            }, player.id, true, {
                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                lineNumber: 597,
                                                                                columnNumber: 31
                                                                            }, this);
                                                                        }) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex items-baseline justify-end gap-2 h-[20px]",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                className: "text-sm text-gray-400 italic leading-5",
                                                                                children: "Nie ustawiono składu"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                lineNumber: 640,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                            lineNumber: 639,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                        lineNumber: 591,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                lineNumber: 534,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, match.id, true, {
                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                        lineNumber: 502,
                                                        columnNumber: 19
                                                    }, this);
                                                })
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                lineNumber: 494,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                        lineNumber: 492,
                                        columnNumber: 23
                                    }, this),
                                    cupGameweeks.length > 0 && cupGameweeks.map((cupGameweek)=>{
                                        const getStageLabel = (stage)=>{
                                            const labels = {
                                                'group_stage': 'Faza Grupowa',
                                                'round_of_16': '1/8 Finału',
                                                'quarter_final': 'Ćwierćfinał',
                                                'semi_final': 'Półfinał',
                                                'final': 'Finał'
                                            };
                                            return labels[stage] || stage;
                                        };
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-8",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-2 mb-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__["Trophy"], {
                                                            size: 20,
                                                            className: "text-yellow-600"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                            lineNumber: 668,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "text-lg font-semibold text-gray-800",
                                                            children: [
                                                                "Mecze Pucharowe - ",
                                                                getStageLabel(cupGameweek.stage),
                                                                cupGameweek.leg === 2 ? ' (Rewanż)' : ''
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                            lineNumber: 669,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                    lineNumber: 667,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-6",
                                                    children: cupGameweek.matches.map((match)=>{
                                                        const homeGoals = match.home_lineup?.players?.reduce((sum, p)=>sum + (playerGoals[p.id] || 0), 0) || 0;
                                                        const awayGoals = match.away_lineup?.players?.reduce((sum, p)=>sum + (playerGoals[p.id] || 0), 0) || 0;
                                                        const homePlayers = match.home_lineup?.players || [];
                                                        const awayPlayers = match.away_lineup?.players || [];
                                                        const getManagerDisplayName = (manager)=>{
                                                            if (manager?.first_name && manager?.last_name) {
                                                                return `${manager.first_name} ${manager.last_name}`;
                                                            }
                                                            if (manager?.first_name) {
                                                                return manager.first_name;
                                                            }
                                                            return manager?.email || 'Unknown Manager';
                                                        };
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-white border-2 border-yellow-600 rounded-2xl hover:shadow-lg transition-shadow duration-200",
                                                            style: {
                                                                padding: '20px'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex justify-end mb-3",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>saveIndividualMatch(match.id),
                                                                        disabled: saving,
                                                                        className: "px-4 py-1 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50",
                                                                        children: saving ? 'Zapisywanie...' : 'Zapisz wynik'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                        lineNumber: 695,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                    lineNumber: 694,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center justify-between mb-3",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex-1",
                                                                            style: {
                                                                                paddingRight: '24px'
                                                                            },
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                className: `text-lg font-semibold ${getManagerNameColor(homePlayers)}`,
                                                                                children: getManagerDisplayName(match.home_manager)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                lineNumber: 707,
                                                                                columnNumber: 33
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                            lineNumber: 706,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex items-center gap-4 px-8",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "text-3xl font-bold text-[#061852]",
                                                                                    children: homeGoals
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                    lineNumber: 712,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "text-2xl font-medium text-gray-400",
                                                                                    children: "-"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                    lineNumber: 713,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "text-3xl font-bold text-[#061852]",
                                                                                    children: awayGoals
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                    lineNumber: 714,
                                                                                    columnNumber: 33
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                            lineNumber: 711,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex-1 text-right",
                                                                            style: {
                                                                                paddingLeft: '24px'
                                                                            },
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                className: `text-lg font-semibold ${getManagerNameColor(awayPlayers)}`,
                                                                                children: getManagerDisplayName(match.away_manager)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                lineNumber: 717,
                                                                                columnNumber: 33
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                            lineNumber: 716,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                    lineNumber: 705,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-start justify-between pt-3 border-t-2 border-yellow-200",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex-1 space-y-1",
                                                                            style: {
                                                                                paddingRight: '32px'
                                                                            },
                                                                            children: homePlayers.length > 0 ? homePlayers.map((player)=>{
                                                                                const goals = playerGoals[player.id] || 0;
                                                                                const hasPlayed = playerHasPlayed[player.id] || false;
                                                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    className: "flex items-baseline gap-2 h-[20px]",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                            type: "checkbox",
                                                                                            checked: hasPlayed,
                                                                                            onChange: (e)=>setPlayerHasPlayed((prev)=>({
                                                                                                        ...prev,
                                                                                                        [player.id]: e.target.checked
                                                                                                    })),
                                                                                            disabled: saving,
                                                                                            className: "w-4 h-4 cursor-pointer disabled:cursor-not-allowed",
                                                                                            title: "Oznacz, że zawodnik rozegrał mecz"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                            lineNumber: 733,
                                                                                            columnNumber: 41
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                            type: "number",
                                                                                            min: "-1",
                                                                                            max: "9",
                                                                                            value: goals,
                                                                                            onChange: (e)=>handlePlayerGoalsChange(player.id, e.target.value),
                                                                                            onFocus: handlePlayerGoalsFocus,
                                                                                            disabled: saving,
                                                                                            className: `w-12 px-1 py-0.5 text-xs text-center border rounded focus:outline-none focus:ring-1 disabled:bg-gray-100 ${goals === -1 ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-600'}`
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                            lineNumber: 741,
                                                                                            columnNumber: 41
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                            className: `text-sm leading-5 ${goals === -1 ? 'font-bold text-red-600' : goals > 0 ? 'font-bold text-[#061852]' : 'text-gray-600'}`,
                                                                                            children: [
                                                                                                player.name,
                                                                                                " ",
                                                                                                player.surname,
                                                                                                goals === -1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                    className: "ml-1 text-red-600",
                                                                                                    children: "(OG)"
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                                    lineNumber: 761,
                                                                                                    columnNumber: 60
                                                                                                }, this)
                                                                                            ]
                                                                                        }, void 0, true, {
                                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                            lineNumber: 755,
                                                                                            columnNumber: 41
                                                                                        }, this),
                                                                                        goals > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "flex items-center gap-1",
                                                                                            children: Array.from({
                                                                                                length: goals
                                                                                            }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Icon$3e$__["Icon"], {
                                                                                                    iconNode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$lucide$2f$lab$2f$dist$2f$esm$2f$icons$2f$soccer$2d$ball$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__soccerBall$3e$__["soccerBall"],
                                                                                                    size: 12,
                                                                                                    className: "text-[#061852]",
                                                                                                    strokeWidth: 2
                                                                                                }, i, false, {
                                                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                                    lineNumber: 766,
                                                                                                    columnNumber: 47
                                                                                                }, this))
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                            lineNumber: 764,
                                                                                            columnNumber: 43
                                                                                        }, this)
                                                                                    ]
                                                                                }, player.id, true, {
                                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                    lineNumber: 732,
                                                                                    columnNumber: 39
                                                                                }, this);
                                                                            }) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex items-baseline gap-2 h-[20px]",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                    className: "text-sm text-gray-400 italic leading-5",
                                                                                    children: "Nie ustawiono składu"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                    lineNumber: 775,
                                                                                    columnNumber: 37
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                lineNumber: 774,
                                                                                columnNumber: 35
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                            lineNumber: 726,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex-1 text-right space-y-1",
                                                                            style: {
                                                                                paddingLeft: '32px'
                                                                            },
                                                                            children: awayPlayers.length > 0 ? awayPlayers.map((player)=>{
                                                                                const goals = playerGoals[player.id] || 0;
                                                                                const hasPlayed = playerHasPlayed[player.id] || false;
                                                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    className: "flex items-baseline justify-end gap-2 h-[20px]",
                                                                                    children: [
                                                                                        goals > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "flex items-center gap-1",
                                                                                            children: Array.from({
                                                                                                length: goals
                                                                                            }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Icon$3e$__["Icon"], {
                                                                                                    iconNode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$lucide$2f$lab$2f$dist$2f$esm$2f$icons$2f$soccer$2d$ball$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__soccerBall$3e$__["soccerBall"],
                                                                                                    size: 12,
                                                                                                    className: "text-[#061852]",
                                                                                                    strokeWidth: 2
                                                                                                }, i, false, {
                                                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                                    lineNumber: 791,
                                                                                                    columnNumber: 47
                                                                                                }, this))
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                            lineNumber: 789,
                                                                                            columnNumber: 43
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                            className: `text-sm leading-5 ${goals === -1 ? 'font-bold text-red-600' : goals > 0 ? 'font-bold text-[#061852]' : 'text-gray-600'}`,
                                                                                            children: [
                                                                                                player.name,
                                                                                                " ",
                                                                                                player.surname,
                                                                                                goals === -1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                    className: "ml-1 text-red-600",
                                                                                                    children: "(OG)"
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                                    lineNumber: 801,
                                                                                                    columnNumber: 60
                                                                                                }, this)
                                                                                            ]
                                                                                        }, void 0, true, {
                                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                            lineNumber: 795,
                                                                                            columnNumber: 41
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                            type: "number",
                                                                                            min: "-1",
                                                                                            max: "9",
                                                                                            value: goals,
                                                                                            onChange: (e)=>handlePlayerGoalsChange(player.id, e.target.value),
                                                                                            onFocus: handlePlayerGoalsFocus,
                                                                                            disabled: saving,
                                                                                            className: `w-12 px-1 py-0.5 text-xs text-center border rounded focus:outline-none focus:ring-1 disabled:bg-gray-100 ${goals === -1 ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500' : 'border-gray-300 focus:ring-yellow-600'}`
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                            lineNumber: 803,
                                                                                            columnNumber: 41
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                            type: "checkbox",
                                                                                            checked: hasPlayed,
                                                                                            onChange: (e)=>setPlayerHasPlayed((prev)=>({
                                                                                                        ...prev,
                                                                                                        [player.id]: e.target.checked
                                                                                                    })),
                                                                                            disabled: saving,
                                                                                            className: "w-4 h-4 cursor-pointer disabled:cursor-not-allowed",
                                                                                            title: "Oznacz, że zawodnik rozegrał mecz"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                            lineNumber: 817,
                                                                                            columnNumber: 41
                                                                                        }, this)
                                                                                    ]
                                                                                }, player.id, true, {
                                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                    lineNumber: 787,
                                                                                    columnNumber: 39
                                                                                }, this);
                                                                            }) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex items-baseline justify-end gap-2 h-[20px]",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                    className: "text-sm text-gray-400 italic leading-5",
                                                                                    children: "Nie ustawiono składu"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                    lineNumber: 830,
                                                                                    columnNumber: 37
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                                lineNumber: 829,
                                                                                columnNumber: 35
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                            lineNumber: 781,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                                    lineNumber: 724,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, match.id, true, {
                                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                            lineNumber: 692,
                                                            columnNumber: 27
                                                        }, this);
                                                    })
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                                    lineNumber: 674,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, cupGameweek.id, true, {
                                            fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                            lineNumber: 666,
                                            columnNumber: 19
                                        }, this);
                                    })
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                                lineNumber: 489,
                                columnNumber: 19
                            }, this)
                        }, void 0, false);
                    })()
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
                lineNumber: 415,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/dashboard/admin/leagues/[id]/results/page.tsx",
        lineNumber: 372,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=src_app_dashboard_admin_leagues_%5Bid%5D_results_page_tsx_fc82ed2a._.js.map