# Squad Selection Page - UI/UX Documentation

## Layout Structure

### Grid Layout
```tsx
<div className="grid xl:grid-cols-3 gap-2.5">
  <div className="xl:col-span-1"> {/* Left: Squad Panel */}
  <div className="xl:col-span-2"> {/* Right: Pitches */}
</div>
```

### Left Column: Squad Panel + Save Button (Sticky)
```tsx
<div className="xl:col-span-1" style={{ width: 'fit-content' }}>
  <div style={{
    position: 'sticky',
    top: '80px',           // Keeps visible below nav (80px from viewport top)
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'            // Space between card and button
  }}>
    <Card className="h-fit">
      <CardContent style={{ padding: '10px' }}>
        {/* Player jerseys in 2-column grid */}
      </CardContent>
    </Card>

    <Button style={{ width: '100%' }}>
      {/* Save button matches squad panel width */}
    </Button>
  </div>
</div>
```

**Key Points:**
- Outer div: `width: 'fit-content'` - prevents full column width
- Inner div: `position: 'sticky'` + `top: '80px'` - stays visible when scrolling
- Button: `width: '100%'` - matches squad panel width
- Gap: `10px` - vertical spacing between card and button

### Right Column: Football Pitches

#### League Pitch
```tsx
<Card className="bg-[#F2F2F2] border-gray-300">
  <CardHeader style={{ padding: '12px 16px' }}>
    <CardTitle className="text-lg">League Lineup</CardTitle>
  </CardHeader>
  <CardContent style={{ padding: '2px' }}>
    {/* Football field with 3 drop zones */}
  </CardContent>
</Card>
```

#### Cup Pitch (Dual Gameweek Only)
```tsx
<Card className="bg-[#F2F2F2] border-yellow-500 border-2 overflow-hidden">
  <CardHeader
    style={{ padding: '16px 24px' }}      // More padding for proper edge fit
    className="bg-yellow-50 rounded-t-2xl" // Rounded top, yellow background
  >
    <CardTitle className="text-lg flex items-center gap-2">
      🏆 Cup Lineup
    </CardTitle>
  </CardHeader>
  <CardContent style={{ padding: '2px' }}>
    {/* Football field */}
  </CardContent>
</Card>
```

**Key Points:**
- `overflow-hidden` on Card - ensures header fits within rounded borders
- `rounded-t-2xl` on CardHeader - matches card's top border radius
- `padding: '16px 24px'` - proper indentation from card edges

## Critical CSS Rules

### Sticky Positioning (DO NOT CHANGE)
```tsx
// ✅ CORRECT - Use inline style with position: 'sticky'
<div style={{ position: 'sticky', top: '80px', ... }}>

// ❌ WRONG - className="sticky" without proper CSS definition
<div className="sticky" style={{ top: '80px', ... }}>

// ❌ WRONG - Applying sticky to column div directly
<div className="xl:col-span-1 sticky top-20">
```

### Wrapper Structure (DO NOT FLATTEN)
```tsx
// ✅ CORRECT - Nested wrapper for sticky
<div className="xl:col-span-1" style={{ width: 'fit-content' }}>
  <div style={{ position: 'sticky', top: '80px', ... }}>
    <Card />
    <Button />
  </div>
</div>

// ❌ WRONG - Direct sticky on column
<div className="xl:col-span-1 sticky" style={{ top: '80px', ... }}>
  <Card />
  <Button />
</div>
```

## Common Issues & Fixes

### Issue 1: Squad Panel Hides When Scrolling
**Cause:** Sticky positioning not properly applied or wrong element has sticky
**Fix:** Ensure inner wrapper div has `position: 'sticky'` and `top: '80px'`

### Issue 2: Cup Header Overflows Card Border
**Cause:** CardHeader background doesn't respect card's rounded corners
**Fix:**
- Add `overflow-hidden` to Card
- Add `rounded-t-2xl` to CardHeader
- Use `padding: '16px 24px'` (not `12px 16px`)

### Issue 3: Save Button Width Doesn't Match Squad Panel
**Cause:** Button has fixed width or centering wrapper
**Fix:** Apply `width: '100%'` to button, no centering wrapper needed

## Testing Checklist

- [ ] Squad panel stays visible when scrolling down
- [ ] Squad panel positioned 80px from top (below navigation)
- [ ] Save button directly under squad panel with 10px gap
- [ ] Save button width matches squad panel width
- [ ] Cup Lineup header fits within card edges (no overflow)
- [ ] Cup header has proper padding (16px top/bottom, 24px left/right)
- [ ] Both squad panel and button scroll together as one sticky unit

## File Locations

- Component: `src/components/SquadSelection.tsx`
- Page: `src/app/dashboard/leagues/[id]/squad/page.tsx`
- Card Component: `src/components/ui/Card.tsx`
