# Deployment Quick Reference Guide

## Pre-Deployment Checklist

Run these commands **before every deployment** to catch errors early:

```bash
# 1. Check for TypeScript errors (MOST IMPORTANT)
npx tsc --noEmit

# 2. Run the build locally
npm run build

# 3. Check ESLint warnings (optional - won't block deployment)
npm run lint
```

## Common Error Patterns & Fixes

### 1. `any` Type Errors

**Error Message:**
```
Error: Unexpected any. Specify a different type.
```

**Fix:** Replace with proper TypeScript interface
```typescript
// ❌ Bad
const [data, setData] = useState<any>(null)

// ✅ Good
const [data, setData] = useState<{ id: string; name: string } | null>(null)
```

---

### 2. Null Safety Errors

**Error Message:**
```
Type error: 'variable' is possibly 'null'.
```

**Fix:** Add null check before accessing properties
```typescript
// ❌ Bad
const id = cup.id // Error if cup is null

// ✅ Good
if (!cup) {
  return // or throw error
}
const id = cup.id // Safe now
```

---

### 3. Supabase Type Inference Issues

**Error Message:**
```
Property 'x' does not exist on type 'Array'
```

**Fix:** Add explicit type assertion
```typescript
// ❌ Bad - TypeScript infers wrong type
const result = await supabase.from('table').select('*, related!inner(*)')

// ✅ Good - Explicit type
const result = await supabase.from('table').select('*, related!inner(*)') as Array<{
  id: string;
  related: { /* define structure */ }
}>
```

---

### 4. Prop Spread Conflicts

**Error Message:**
```
'propName' is specified more than once
```

**Fix:** Remove explicit props that are in the spread
```typescript
// ❌ Bad
<Component prop1={value1} prop2={value2} {...allProps} />

// ✅ Good (if allProps contains prop1 and prop2)
<Component {...allProps} />
```

---

### 5. Player/Type Mismatches

**Error Message:**
```
Type 'X' is missing properties: 'createdAt', 'updatedAt'
```

**Fix:** Use subset type or type assertion
```typescript
// ✅ Option 1: Use subset type in interface
interface Props {
  player: Pick<Player, 'name' | 'surname' | 'position'>
}

// ✅ Option 2: Type assertion
setPlayer(playerSubset as Player)
```

---

## Critical Files to Check

When making changes to these files, **always verify TypeScript**:

1. **SquadSelection components**
   - `src/components/SquadSelection.tsx`
   - `src/components/SquadSelection 2.tsx`
   - `src/components/SquadSelection.old.tsx`

2. **Dashboard pages**
   - `src/app/dashboard/page.tsx`
   - `src/app/dashboard/admin/leagues/[id]/cup/schedule/page.tsx`

3. **UI components**
   - `src/components/ui/EmptyState.tsx`
   - `src/components/ui/Input.tsx`

---

## Emergency Deployment Fix

If deployment is failing and you need to identify the error quickly:

```bash
# 1. Check the Vercel build log for the error line number
# 2. Search for the file and line number
# 3. Run local TypeScript check
npx tsc --noEmit | grep "filename.tsx"

# 4. Fix the specific error
# 5. Verify fix
npx tsc --noEmit

# 6. Commit and push
git add .
git commit -m "Fix TypeScript error in filename.tsx"
git push
```

---

## What NOT to Do

❌ **Don't use `any` types** - Always define proper interfaces
❌ **Don't skip local build testing** - Always run `npm run build` locally first
❌ **Don't ignore TypeScript errors** - They will block deployment
❌ **Don't commit multiple fixes at once** - Fix one error at a time when debugging
❌ **Don't use `@ts-ignore`** - Fix the underlying type issue instead

---

## Build Success Indicators

You'll know the build will succeed when:

✅ `npx tsc --noEmit` returns no errors
✅ `npm run build` completes successfully
✅ Only ESLint **warnings** (not errors) remain

---

## Common Vercel Build Errors to Watch For

1. **TypeScript compilation errors** (most common) - Block deployment
2. **ESLint errors** - Can block if configured strictly
3. **Missing environment variables** - Check Vercel dashboard
4. **Import errors** - Wrong paths or missing files
5. **Dependency issues** - Check `package.json` and lock file

---

*Quick guide created: October 19, 2025*
