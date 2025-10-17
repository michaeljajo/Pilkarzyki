# Horizontal Spacing Guide

## Overview

This guide establishes consistent horizontal spacing (left/right margins, gaps, and padding) throughout the design system for a modern, readable, and premium layout.

## Core Principles

1. **Container Margins**: Generous page margins prevent elements from touching viewport edges
2. **Grid Gaps**: Consistent horizontal spacing between cards and components
3. **Object Spacing**: Defined gaps ensure visual objects never stack directly
4. **Responsive Scaling**: Padding adjusts based on screen size

## Container Padding System

### Responsive Side Padding

```css
/* Mobile (< 768px) */
--container-padding-mobile: 16px;

/* Tablet (769px - 1024px) */
--container-padding-tablet: 24px;

/* Desktop (1025px - 1439px) */
--container-padding-desktop: 32px;

/* Wide Screen (≥ 1440px) */
--container-padding-wide: 48px;
```

### Implementation

```css
.container {
  width: 100%;
  max-width: 1536px;
  margin: 0 auto;
  padding-left: var(--container-padding-desktop);
  padding-right: var(--container-padding-desktop);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .container {
    padding-left: var(--container-padding-mobile);
    padding-right: var(--container-padding-mobile);
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .container {
    padding-left: var(--container-padding-tablet);
    padding-right: var(--container-padding-tablet);
  }
}

@media (min-width: 1440px) {
  .container {
    padding-left: var(--container-padding-wide);
    padding-right: var(--container-padding-wide);
  }
}
```

## Horizontal Gap Scale

### Standard Gaps (8px increments)

```css
--gap-xs: 8px;    /* Minimal gap - badges, inline items */
--gap-sm: 16px;   /* Small objects - buttons in group */
--gap-md: 24px;   /* Medium objects - color cards */
--gap-lg: 32px;   /* Large objects - major cards */
--gap-xl: 40px;   /* Extra large - component groups */
--gap-2xl: 48px;  /* Maximum - major separations */
```

### Usage Guide

| Gap Size | Use Case | Examples |
|----------|----------|----------|
| **xs (8px)** | Tightly related items | Badges, icon + text, chip groups |
| **sm (16px)** | Related buttons/controls | Button groups, form controls |
| **md (24px)** | Standard grid items | Color swatches, small cards |
| **lg (32px)** | Larger components | Feature cards, border radius examples |
| **xl (40px)** | Component groups | Separated sections within same area |
| **2xl (48px)** | Major separations | Distinct feature areas |

## Grid Layout Spacing

### Color Grids
```css
/* Primary Colors - 4 columns */
.primary-color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--gap-lg);  /* 32px */
}

/* Semantic Colors - 6 columns */
.semantic-color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--gap-md);  /* 24px */
}

/* Teal Palette - 5 columns */
.teal-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--gap-md);  /* 24px */
}
```

### Component Grids
```css
/* Border Radius Examples */
.radius-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--gap-xl);  /* 40px - larger items need more space */
}

/* Card Layouts */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--gap-lg);  /* 32px */
}
```

### Button Groups
```css
/* Button Row */
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-md);  /* 24px between buttons */
}

/* Badge Row */
.badge-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-sm);  /* 16px between badges */
}
```

## Utility Classes

### Gap Utilities
```css
/* Universal gap (works with flex & grid) */
.gap-xs { gap: 8px; }
.gap-sm { gap: 16px; }
.gap-md { gap: 24px; }
.gap-lg { gap: 32px; }
.gap-xl { gap: 40px; }
.gap-2xl { gap: 48px; }

/* Grid-specific (separate column/row control) */
.grid-gap-sm {
  column-gap: 16px;
  row-gap: 16px;
}

.grid-gap-md {
  column-gap: 24px;
  row-gap: 24px;
}

.grid-gap-lg {
  column-gap: 32px;
  row-gap: 32px;
}

.grid-gap-xl {
  column-gap: 40px;
  row-gap: 40px;
}

/* Flex-specific */
.flex-gap-sm { gap: 16px; }
.flex-gap-md { gap: 24px; }
.flex-gap-lg { gap: 32px; }
```

### Container Padding Utilities
```css
.container-padding {
  padding-left: var(--container-padding-desktop);
  padding-right: var(--container-padding-desktop);
}

.container-padding-sm {
  padding-left: var(--container-padding-mobile);
  padding-right: var(--container-padding-mobile);
}

.container-padding-lg {
  padding-left: var(--container-padding-wide);
  padding-right: var(--container-padding-wide);
}
```

## Visual Examples

### Example 1: Page Layout
```
┌─────────────────────────────────────────────────────────┐
│ ←32px→                                          ←32px→  │
│        ╔═══════════════════════════════════╗           │
│        ║ Content Area (max-width: 1536px) ║           │
│        ║                                   ║           │
│        ║  Grid: 4 columns, 32px gap        ║           │
│        ║  ┌────┐ ←32px→ ┌────┐ ←32px→      ║           │
│        ║  │Card│        │Card│             ║           │
│        ║  └────┘        └────┘             ║           │
│        ╚═══════════════════════════════════╝           │
└─────────────────────────────────────────────────────────┘
```

### Example 2: Button Group
```
┌─────────────────────────────────────────┐
│  [Primary] ←24px→ [Secondary] ←24px→    │
│  [Outline] ←24px→ [Ghost]               │
└─────────────────────────────────────────┘
```

### Example 3: Color Grid
```
Primary Colors (4 columns, 32px gap)
┌─────────┐ ←32px→ ┌─────────┐ ←32px→ ┌─────────┐ ←32px→ ┌─────────┐
│  Rich   │        │Collegiate│        │  Sand   │        │Off-White│
│  Green  │        │  Navy   │        │  Gold   │        │         │
└─────────┘        └─────────┘        └─────────┘        └─────────┘
```

## Component-Specific Spacing

### Navigation Bar
```css
nav {
  display: flex;
  align-items: center;
  gap: var(--gap-lg);  /* 32px between nav items */
  padding: 0 var(--container-padding-desktop);
}

nav .nav-group {
  display: flex;
  gap: var(--gap-md);  /* 24px within group */
}
```

### Icon Grid
```css
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--gap-md);  /* 24px between icons */
}
```

### Form Layout
```css
.form-row {
  display: flex;
  gap: var(--gap-md);  /* 24px between form fields */
}

.form-group {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);  /* 16px between label and input */
}
```

## Implementation Examples

### React Component with Horizontal Spacing
```jsx
// Page Container
function Page() {
  return (
    <div className="max-w-[1536px] mx-auto container-padding py-16">
      <section>
        <h2>Color System</h2>

        {/* Color Grid with 32px gap */}
        <div className="grid grid-cols-4 gap-lg">
          <ColorCard />
          <ColorCard />
          <ColorCard />
          <ColorCard />
        </div>
      </section>
    </div>
  )
}

// Button Group
function ButtonGroup() {
  return (
    <div className="flex flex-wrap gap-md">
      <button>Primary</button>
      <button>Secondary</button>
      <button>Outline</button>
    </div>
  )
}

// Card Grid
function CardGrid() {
  return (
    <div className="grid md:grid-cols-3 gap-lg">
      <Card />
      <Card />
      <Card />
    </div>
  )
}
```

### Figma Auto Layout Configuration

#### Frame: Page Container
- **Padding**:
  - Mobile: 16px left/right
  - Tablet: 24px left/right
  - Desktop: 32px left/right
  - Wide: 48px left/right

#### Frame: Color Grid
- **Layout**: Grid
- **Columns**: 4
- **Column gap**: 32px
- **Row gap**: 32px (if wrapping)

#### Frame: Button Group
- **Layout**: Horizontal flex
- **Spacing between items**: 24px
- **Wrap**: On

#### Frame: Card Grid
- **Layout**: Grid
- **Columns**: 3
- **Gap**: 32px

## Responsive Behavior

### Mobile (< 768px)
```css
/* Tighter spacing for smaller screens */
- Container padding: 16px
- Grid gaps: Reduce by 25% (24px → 18px, 32px → 24px)
- Button groups: 16px gap
```

### Tablet (769px - 1024px)
```css
/* Moderate spacing */
- Container padding: 24px
- Grid gaps: Standard (24px, 32px)
- Button groups: 20px gap
```

### Desktop (1025px+)
```css
/* Generous spacing */
- Container padding: 32px (48px for wide screens)
- Grid gaps: Full scale (24px, 32px, 40px)
- Button groups: 24px gap
```

## Validation Checklist

✅ **Container Margins**
- [ ] Page has 32px horizontal padding (desktop)
- [ ] Padding adjusts on mobile (16px) and wide screens (48px)
- [ ] Content never touches viewport edges

✅ **Grid Layouts**
- [ ] Color grids: 24px or 32px gap
- [ ] Card grids: 32px gap minimum
- [ ] Radius examples: 40px gap
- [ ] All grids have defined column-gap and row-gap

✅ **Component Groups**
- [ ] Button groups: 24px gap
- [ ] Badge groups: 16px gap
- [ ] Icon grids: 24px gap
- [ ] Form fields: 24px gap

✅ **Visual Separation**
- [ ] Related items: 16-24px gap
- [ ] Unrelated groups: 40-48px gap
- [ ] Major sections: Visual divider + 48px gap

✅ **Responsive**
- [ ] Mobile padding: 16px
- [ ] Tablet padding: 24px
- [ ] Desktop padding: 32px
- [ ] Wide screen padding: 48px

## Benefits

1. **No Edge Touching**: Generous margins prevent cramped layouts
2. **Visual Breathing Room**: Consistent gaps between all objects
3. **Clear Grouping**: Spacing indicates relationships
4. **Responsive Adaptation**: Scales appropriately for screen size
5. **Premium Feel**: Generous whitespace signals quality
6. **Accessibility**: Adequate spacing improves comprehension

## Common Mistakes to Avoid

❌ **Don't:**
- Let elements touch viewport edges (always use container padding)
- Use inconsistent gaps (stick to scale: 16, 24, 32, 40, 48)
- Forget to define gap on grid/flex containers
- Use the same gap for all grid types (adjust based on item size)
- Ignore responsive adjustments for mobile

✅ **Do:**
- Always wrap content in container with padding
- Use semantic gap utilities (gap-md, gap-lg)
- Define both column-gap and row-gap for grids
- Larger items = larger gaps (cards: 32px, buttons: 24px)
- Reduce spacing proportionally on mobile

## Quick Reference

### Container Padding
| Screen Size | Padding |
|-------------|---------|
| Mobile | 16px |
| Tablet | 24px |
| Desktop | 32px |
| Wide | 48px |

### Grid Gaps
| Content Type | Gap |
|--------------|-----|
| Color swatches | 24-32px |
| Badges | 16px |
| Buttons | 24px |
| Cards | 32px |
| Radius examples | 40px |
| Icon grid | 24px |

### Utility Classes Quick Copy
```jsx
// Container
<div className="container-padding">

// Grids
<div className="grid grid-cols-4 gap-lg">
<div className="grid grid-cols-6 gap-md">

// Flex groups
<div className="flex gap-md">
<div className="flex gap-sm">

// Responsive
<div className="gap-md lg:gap-lg">
```
