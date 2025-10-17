# Vertical Spacing Rules - Quick Reference

## 8px Modular Grid System

All vertical spacing uses **8px increments** for mathematical consistency and visual harmony.

## Spacing Hierarchy (Largest to Smallest)

```
1. Section → Section           80px  (10 × 8px)
2. Section Header → Content    48px  (6 × 8px)
3. Subsection → Subsection     56px  (7 × 8px)
4. H3 → Grid                   24px  (3 × 8px)
5. H2 → Description            16px  (2 × 8px)
6. Card Internal Spacing       16px/8px
```

## Visual Spacing Map

```
Page Container (64px top, 96px bottom)
│
├── Section (80px bottom) ─────────────────────┐
│   │                                          │
│   ├── H2 Title (line-height: 1.3)           │
│   │   ↓ 16px                                 │
│   ├── Description (line-height: 1.6)        │
│   │   ↓ 48px                                 │
│   │                                          │
│   ├── Subsection 1 (56px bottom) ──────┐    │
│   │   │                                 │    │
│   │   ├── H3 Title (uppercase)          │    │
│   │   │   ↓ 24px                        │    │
│   │   ├── Grid (24px gap)               │    │
│   │   │   ┌─────┐ ┌─────┐ ┌─────┐      │    │
│   │   │   │Card │ │Card │ │Card │      │    │
│   │   │   │ ↓16 │ │     │ │     │      │    │
│   │   │   │ ↓8  │ │     │ │     │      │    │
│   │   │   │ ↓8  │ │     │ │     │      │    │
│   │   │   └─────┘ └─────┘ └─────┘      │    │
│   │   └─────────────────────────────────┘    │
│   │   ↓ 56px                                 │
│   │                                          │
│   ├── Subsection 2 (56px bottom)            │
│   │   ↓ (same structure)                    │
│   │                                          │
│   ├── Subsection 3 (0px bottom - last)      │
│   │   ↓ (same structure)                    │
│   │                                          │
│   └──────────────────────────────────────────┘
│   ↓ 80px
│
├── Next Section ──────────────────────────────
```

## Typography Line Heights

```css
H2:        1.3  (130% - tight for impact)
H3:        1.35 (135% - balanced)
Body (P):  1.6  (160% - comfortable reading)
```

## Grid Gaps

```css
Color cards:       24px gap
Radius examples:   32px gap
Typography scale:  24px gap
Form fields:       24px gap
```

## Card Internal Spacing

```
┌─────────────────┐
│  Color Swatch   │
└─────────────────┘
      ↓ 16px
┌─────────────────┐
│  Title (bold)   │
└─────────────────┘
      ↓ 8px
┌─────────────────┐
│  Hex Code       │
└─────────────────┘
      ↓ 8px
┌─────────────────┐
│  Usage Text     │
└─────────────────┘
```

## CSS Implementation

### Section
```css
section {
  margin-bottom: 80px;
}
```

### Section Header
```css
.section-header {
  margin-bottom: 48px;
}

.section-header h2 {
  line-height: 1.3;
  margin-bottom: 16px;
}

.section-header p {
  line-height: 1.6;
}
```

### Subsection
```css
.subsection {
  margin-bottom: 56px;
}

.subsection:last-child {
  margin-bottom: 0;  /* Important! */
}

.subsection h3 {
  margin-bottom: 24px;
}
```

### Grids
```css
.color-grid {
  display: grid;
  gap: 24px;
}

.radius-grid {
  display: grid;
  gap: 32px;
}
```

## Validation Rules

✅ **Always use 8px increments**: 8, 16, 24, 32, 48, 56, 64, 80, 96
✅ **Remove last-child margin**: Prevents double spacing
✅ **Section headers get 48px below**: Creates clear breaks
✅ **Subsections get 56px between**: Moderate separation
✅ **H3 gets 24px to content**: Tight connection
✅ **H2 gets 16px to paragraph**: Close relationship
✅ **Line height 1.6 for body**: Optimal readability

❌ **Never use**: 18px, 23px, 37px, 45px (not on grid)
❌ **Never forget**: Last-child margin removal
❌ **Never compress**: Line height below 1.3

## Quick Copy-Paste

### Section Template
```jsx
<section style={{ marginBottom: '80px' }}>
  <div style={{ marginBottom: '48px' }}>
    <h2 style={{ lineHeight: '1.3', marginBottom: '16px' }}>
      Section Title
    </h2>
    <p style={{ lineHeight: '1.6' }}>
      Description
    </p>
  </div>

  <div style={{ marginBottom: '56px' }}>
    <h3 style={{ marginBottom: '24px' }}>Subsection</h3>
    <div style={{ gap: '24px' }}>{/* Content */}</div>
  </div>
</section>
```

### Color Card Template
```jsx
<div>
  <div style={{ marginBottom: '16px' }}>Swatch</div>
  <p style={{ marginBottom: '8px' }}>Title</p>
  <p style={{ marginBottom: '8px' }}>Hex</p>
  <p>Usage</p>
</div>
```

## Design Tokens

```css
:root {
  /* Spacing */
  --section-gap: 80px;
  --section-header-gap: 48px;
  --subsection-gap: 56px;
  --h3-gap: 24px;
  --h2-gap: 16px;
  --card-gap: 16px;
  --label-gap: 8px;

  /* Grids */
  --grid-gap: 24px;
  --grid-gap-lg: 32px;

  /* Line Heights */
  --lh-heading: 1.3;
  --lh-body: 1.6;
}
```

## Benefits

1. **Visual Calm**: Regular rhythm prevents jarring transitions
2. **Easy Scanning**: Clear hierarchy guides the eye naturally
3. **Maintainable**: Simple rules, easy to remember
4. **Scalable**: Works at any screen size
5. **Accessible**: Generous spacing aids comprehension
6. **Professional**: Consistent spacing signals quality

## Summary

- **Page**: 64px top, 96px bottom padding
- **Sections**: 80px apart
- **Headers**: 48px to content
- **Subsections**: 56px apart
- **H3**: 24px to grid
- **H2**: 16px to description
- **Grids**: 24px gap (32px for larger items)
- **Cards**: 16px swatch-to-title, 8px between labels
- **Line heights**: 1.3 headings, 1.6 body
- **Last child**: Always 0 bottom margin
