# Modular Vertical Spacing System

## System Overview

This design system uses a **strict 8px modular grid** for all vertical spacing. Every gap, margin, and padding follows this mathematical rhythm to create visual harmony and predictable layouts.

## Core Spacing Scale (8px Increments)

```
8px   = 1 unit  (0.5rem)   = --space-2
16px  = 2 units (1rem)     = --space-4
24px  = 3 units (1.5rem)   = --space-6
32px  = 4 units (2rem)     = --space-8
48px  = 6 units (3rem)     = --space-12
56px  = 7 units (3.5rem)   = --space-14
64px  = 8 units (4rem)     = --space-16
80px  = 10 units (5rem)    = --space-20
96px  = 12 units (6rem)    = --space-24
```

## Vertical Spacing Hierarchy

### Level 1: Section Spacing (Major Breaks)
**80px between major sections**
```css
section {
  margin-bottom: 80px;
}
```
Use between: Color → Typography → Buttons → Forms (main sections)

### Level 2: Section Header to Content
**48px from section header to first content**
```css
.section-header {
  margin-bottom: 48px;
}
```
Includes: H2 + description paragraph

### Level 3: Subsection Spacing
**56px between subsections within a section**
```css
.subsection {
  margin-bottom: 56px;
}
```
Use between: Primary Colors → Semantic Colors → Teal Palette

### Level 4: Subsection Header to Content
**24px from subsection header (H3) to content**
```css
h3 {
  margin-bottom: 24px;
}
```

### Level 5: Text Block Spacing
**16px from heading to description**
```css
h2 {
  margin-bottom: 16px;  /* to following paragraph */
}
```

### Level 6: Within Cards/Components
**8px between labels and values**
```css
.label {
  margin-bottom: 8px;
}
```

## Complete Spacing Rules

### Headings

```css
/* H2 (Section Heading) */
h2 {
  line-height: 1.3;        /* 130% */
  margin-bottom: 16px;     /* To description */
}

/* H3 (Subsection Heading) */
h3 {
  margin-bottom: 24px;     /* To content grid */
}

/* Section Header Block */
.section-header {
  margin-bottom: 48px;     /* To first subsection */
}
```

### Content Blocks

```css
/* Between subsections */
.subsection {
  margin-bottom: 56px;
}

/* Last subsection has no margin */
.subsection:last-child {
  margin-bottom: 0;
}

/* Grid gaps */
.color-grid {
  gap: 24px;              /* Between color cards */
}

.radius-grid {
  gap: 32px;              /* Between radius examples */
}
```

### Typography Internal Spacing

```css
/* Color card */
.color-swatch {
  margin-bottom: 16px;    /* Swatch to title */
}

.color-title {
  margin-bottom: 8px;     /* Title to hex */
}

.color-hex {
  margin-bottom: 8px;     /* Hex to usage (if present) */
}

.color-usage {
  margin-top: 8px;        /* Extra space above usage */
}
```

### Page Container

```css
.page-container {
  padding-top: 64px;      /* Top breathing room */
  padding-bottom: 96px;   /* Extra bottom space */
}

header {
  padding-top: 32px;
  padding-bottom: 32px;
}
```

## Visual Spacing Map

```
┌─────────────────────────────────────┐
│ Header (32px padding top/bottom)   │
├─────────────────────────────────────┤
│                                     │
│  64px padding top                   │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║ Section (80px bottom margin)  ║  │
│  ║                               ║  │
│  ║  H2 + Description             ║  │
│  ║  ↓ 48px                       ║  │
│  ║                               ║  │
│  ║  ┌─────────────────────────┐  ║  │
│  ║  │ Subsection              │  ║  │
│  ║  │ H3                      │  ║  │
│  ║  │ ↓ 24px                  │  ║  │
│  ║  │ Content Grid (24px gap) │  ║  │
│  ║  └─────────────────────────┘  ║  │
│  ║  ↓ 56px                       ║  │
│  ║  ┌─────────────────────────┐  ║  │
│  ║  │ Subsection              │  ║  │
│  ║  │ H3                      │  ║  │
│  ║  │ ↓ 24px                  │  ║  │
│  ║  │ Content Grid            │  ║  │
│  ║  └─────────────────────────┘  ║  │
│  ╚═══════════════════════════════╝  │
│  ↓ 80px                             │
│  ╔═══════════════════════════════╗  │
│  ║ Next Section                  ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  96px padding bottom                │
└─────────────────────────────────────┘
```

## Implementation Examples

### Example 1: Section Structure

```jsx
<section style={{ marginBottom: '80px' }}>
  {/* Section Header - 48px below */}
  <div style={{ marginBottom: '48px' }}>
    <h2 style={{ lineHeight: '1.3', marginBottom: '16px' }}>
      Color
    </h2>
    <p style={{ lineHeight: '1.6' }}>
      Description text
    </p>
  </div>

  {/* Subsection - 56px below */}
  <div style={{ marginBottom: '56px' }}>
    <h3 style={{ marginBottom: '24px' }}>
      Primary Colors
    </h3>
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Color cards */}
    </div>
  </div>

  {/* Last subsection - no bottom margin */}
  <div>
    <h3 style={{ marginBottom: '24px' }}>
      Teal Palette
    </h3>
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Color cards */}
    </div>
  </div>
</section>
```

### Example 2: Color Card Spacing

```jsx
function ColorCard({ name, hex, usage }) {
  return (
    <div>
      <div
        style={{
          height: '128px',
          backgroundColor: hex,
          marginBottom: '16px'    /* Swatch to title */
        }}
      />
      <p style={{ marginBottom: '8px' }}>  {/* Title to hex */}
        {name}
      </p>
      <p style={{ marginBottom: '8px' }}>  {/* Hex to usage */}
        {hex}
      </p>
      {usage && (
        <p style={{ marginTop: '8px' }}>   {/* Usage with extra top space */}
          {usage}
        </p>
      )}
    </div>
  )
}
```

## Figma Auto Layout Configuration

### Section Level
- **Between sections**: 80px
- **Section header to content**: 48px
- **Between subsections**: 56px

### Component Level
- **H3 to grid**: 24px
- **H2 to paragraph**: 16px
- **Grid gaps**: 24px (colors), 32px (radius)

### Micro Level
- **Within cards**: 8px between elements
- **Swatch to title**: 16px

## CSS Variables

```css
/* Spacing tokens */
--section-gap: 80px;           /* Between major sections */
--section-header-gap: 48px;    /* Section header to content */
--subsection-gap: 56px;        /* Between subsections */
--subsection-header-gap: 24px; /* Subsection header to content */
--heading-paragraph-gap: 16px; /* Heading to description */
--grid-gap-sm: 24px;          /* Grids with smaller items */
--grid-gap-md: 32px;          /* Grids with larger items */
--label-gap: 8px;             /* Labels to values */
```

## Quick Reference Table

| Element Pair | Spacing | Use Case |
|-------------|---------|----------|
| Section → Section | 80px | Major breaks (Color → Typography) |
| Section header → First subsection | 48px | After H2 + description block |
| Subsection → Subsection | 56px | Within section (Primary → Semantic) |
| H3 → Content grid | 24px | Subsection header to content |
| H2 → Paragraph | 16px | Heading to description |
| Grid items | 24px | Color cards, small components |
| Grid items | 32px | Larger components (radius) |
| Swatch → Title | 16px | In color cards |
| Title → Hex | 8px | In color cards |
| Hex → Usage | 8px | In color cards |

## Typography Line Heights

```css
h2 {
  line-height: 1.3;  /* 130% - tight for impact */
}

h3 {
  line-height: 1.35; /* 135% */
}

p {
  line-height: 1.6;  /* 160% - comfortable reading */
}
```

## Common Patterns

### Pattern 1: Section with Multiple Subsections
```
Section header (H2 + p)
  ↓ 48px
Subsection 1 (H3 + grid)
  ↓ 56px
Subsection 2 (H3 + grid)
  ↓ 56px
Subsection 3 (H3 + grid)
  ↓ 0px (last child)
Section ends
  ↓ 80px
Next section
```

### Pattern 2: Card Internal Spacing
```
Swatch (image/color block)
  ↓ 16px
Title (bold text)
  ↓ 8px
Hex code (mono font)
  ↓ 8px
Usage (optional description)
```

## Validation Checklist

✅ All vertical spacing uses 8px increments
✅ Sections are 80px apart
✅ Section headers have 48px below
✅ Subsections are 56px apart
✅ H3 has 24px below to grid
✅ H2 has 16px below to paragraph
✅ Color grids use 24px gap
✅ Radius grids use 32px gap
✅ Card labels are 8px from values
✅ Last subsection has no bottom margin
✅ Line height is 1.3 for headings, 1.6 for body

## Anti-Patterns to Avoid

❌ **Don't use arbitrary values**: 18px, 23px, 37px
❌ **Don't skip the hierarchy**: Section → Subsection → Content
❌ **Don't forget last-child margins**: Remove bottom margin from last items
❌ **Don't use inconsistent gaps**: All color grids = 24px, all radius = 32px
❌ **Don't compress line heights**: Below 1.3 for headings, 1.6 for body

## Benefits of This System

1. **Mathematical Consistency**: All spacing is predictable (8px × n)
2. **Visual Calm**: Regular rhythm prevents jarring transitions
3. **Easy Scanning**: Clear hierarchy guides the eye
4. **Maintainable**: Simple rules, easy to remember
5. **Scalable**: Works at any screen size with proportional adjustments
