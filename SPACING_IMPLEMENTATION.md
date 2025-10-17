# Vertical Spacing Implementation Guide

## Design System Screenshot Analysis & Implementation

Based on the Pilkarzyki Design System screenshot, here's the systematic 8px grid vertical spacing applied:

## Implemented Spacing Hierarchy

### 📐 Modular Scale (8px Grid)

```
Level 1: Sections         → 80px (10 units)
Level 2: Section Header   → 48px (6 units)
Level 3: Subsections      → 56px (7 units)
Level 4: Subsection H3    → 24px (3 units)
Level 5: H2 to Paragraph  → 16px (2 units)
Level 6: Micro Spacing    → 8px (1 unit)
```

## Exact Spacing Breakdown

### Page Container
```css
.page-container {
  padding-top: 64px;      /* 8 units */
  padding-bottom: 96px;   /* 12 units */
}
```

### Section: "Color"
```
┌─────────────────────────────────────────┐
│ H2: "Color"                             │
│   line-height: 1.3                      │
│   ↓ 16px (H2 → description)             │
│ P: "We keep our Arsenal brand..."       │
│   line-height: 1.6                      │
│   ↓ 48px (section header → subsection)  │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ H3: "PRIMARY COLORS"              │   │
│ │   ↓ 24px (H3 → grid)              │   │
│ │ Grid: 4 columns, 24px gap         │   │
│ │ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │   │
│ │ │ ↓  │ │    │ │    │ │    │       │   │
│ │ │16px│ │    │ │    │ │    │       │   │
│ │ │ ↓  │ │    │ │    │ │    │       │   │
│ │ │8px │ │    │ │    │ │    │       │   │
│ │ │ ↓  │ │    │ │    │ │    │       │   │
│ │ │8px │ │    │ │    │ │    │       │   │
│ │ └────┘ └────┘ └────┘ └────┘       │   │
│ └───────────────────────────────────┘   │
│   ↓ 56px (subsection → subsection)      │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ H3: "SEMANTIC COLORS"             │   │
│ │   ↓ 24px                          │   │
│ │ Grid: 6 columns, 24px gap         │   │
│ └───────────────────────────────────┘   │
│   ↓ 56px                                │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ H3: "Teal Accent Palette"         │   │
│ │   ↓ 24px                          │   │
│ │ Grid: 5 columns, 24px gap         │   │
│ └───────────────────────────────────┘   │
│   ↓ 0px (last subsection)               │
└─────────────────────────────────────────┘
  ↓ 80px (section → section)

┌─────────────────────────────────────────┐
│ Next Section: "Typeface"                │
└─────────────────────────────────────────┘
```

### Color Card Internal Spacing
```
┌──────────────────┐
│   Color Swatch   │
│   (h-32 = 128px) │
└──────────────────┘
       ↓ 16px
┌──────────────────┐
│   "Rich Green"   │  (font-semibold, text-sm)
└──────────────────┘
       ↓ 8px
┌──────────────────┐
│   "#29544D"      │  (text-xs, font-mono)
└──────────────────┘
       ↓ 8px
┌──────────────────┐
│ "Primary actions"│  (text-xs, description)
└──────────────────┘
```

## CSS Implementation

### Complete Section Structure
```jsx
<section style={{ marginBottom: '80px' }}>
  {/* Section Header Block */}
  <div style={{ marginBottom: '48px' }}>
    <h2
      className="text-4xl font-bold text-gray-900"
      style={{ lineHeight: '1.3', marginBottom: '16px' }}
    >
      Color
    </h2>
    <p
      className="text-lg text-gray-600"
      style={{ lineHeight: '1.6' }}
    >
      We keep our Arsenal brand feeling happy, playful and friendly by using the following color palette.
    </p>
  </div>

  {/* Subsection 1: Primary Colors */}
  <div style={{ marginBottom: '56px' }}>
    <h3
      className="text-sm font-semibold text-gray-500 uppercase tracking-wider"
      style={{ marginBottom: '24px' }}
    >
      Primary Colors
    </h3>
    <div
      className="grid grid-cols-4"
      style={{ gap: '24px' }}
    >
      <ColorCard {...} />
    </div>
  </div>

  {/* Subsection 2: Semantic Colors */}
  <div style={{ marginBottom: '56px' }}>
    <h3 style={{ marginBottom: '24px' }}>
      Semantic Colors
    </h3>
    <div style={{ gap: '24px' }}>
      {/* Cards */}
    </div>
  </div>

  {/* Subsection 3: Teal Palette - NO BOTTOM MARGIN */}
  <div>
    <h3 style={{ marginBottom: '24px' }}>
      Teal Accent Palette
    </h3>
    <div style={{ gap: '24px' }}>
      {/* Cards */}
    </div>
  </div>
</section>
```

### Color Card Component
```jsx
function ColorCard({ name, hex, usage }) {
  return (
    <div>
      {/* Swatch */}
      <div
        className="h-32 rounded-xl"
        style={{
          backgroundColor: hex,
          marginBottom: '16px'
        }}
      />

      {/* Title */}
      <p
        className="font-semibold text-gray-900 text-sm"
        style={{ marginBottom: '8px' }}
      >
        {name}
      </p>

      {/* Hex Code */}
      <p
        className="text-xs text-gray-500 font-mono"
        style={{ marginBottom: usage ? '8px' : '0' }}
      >
        {hex}
      </p>

      {/* Usage (optional) */}
      {usage && (
        <p
          className="text-xs text-gray-600"
          style={{ marginTop: '8px' }}
        >
          {usage}
        </p>
      )}
    </div>
  )
}
```

## Typography Line Heights

```css
/* Headings - Tight for Impact */
h2 {
  font-size: 42px;        /* text-4xl */
  line-height: 1.3;       /* 54.6px */
  font-weight: 700;
}

h3 {
  font-size: 12px;        /* text-sm */
  line-height: 1.35;      /* 16.2px */
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Body Text - Comfortable Reading */
p {
  font-size: 18px;        /* text-lg for descriptions */
  line-height: 1.6;       /* 28.8px */
}

/* Card Labels */
.card-title {
  font-size: 14px;        /* text-sm */
  line-height: 1.4;       /* 19.6px */
}

.card-meta {
  font-size: 12px;        /* text-xs */
  line-height: 1.5;       /* 18px */
}
```

## Grid Gaps by Content Type

```css
/* Color Cards - Smaller Items */
.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;              /* 3 units */
}

/* Semantic Colors - More Items */
.semantic-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 24px;              /* Consistent with above */
}

/* Border Radius - Larger Items */
.radius-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;              /* 4 units - more breathing room */
}
```

## Figma Auto Layout Settings

### Frame: Section
- **Direction**: Vertical
- **Spacing between items**:
  - Header block → First subsection: 48px
  - Subsection → Subsection: 56px
- **Padding**:
  - Bottom: 80px (to next section)

### Frame: Section Header
- **Direction**: Vertical
- **Spacing between items**: 16px (H2 → P)
- **Padding**: None

### Frame: Subsection
- **Direction**: Vertical
- **Spacing between items**: 24px (H3 → Grid)
- **Padding**: None

### Frame: Color Grid
- **Direction**: Horizontal
- **Layout**: Grid (4 columns)
- **Column gap**: 24px
- **Row gap**: 24px (if wrapping)

### Frame: Color Card
- **Direction**: Vertical
- **Spacing between items**:
  - Swatch → Title: 16px
  - Title → Hex: 8px
  - Hex → Usage: 8px
- **Padding**: None

## Design Tokens (CSS Custom Properties)

```css
:root {
  /* Primary Spacing Scale */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-6: 48px;
  --space-7: 56px;
  --space-10: 80px;
  --space-12: 96px;

  /* Semantic Spacing */
  --section-gap: 80px;
  --section-header-gap: 48px;
  --subsection-gap: 56px;
  --h3-to-content: 24px;
  --h2-to-description: 16px;
  --grid-gap-standard: 24px;
  --grid-gap-large: 32px;
  --card-swatch-gap: 16px;
  --card-label-gap: 8px;

  /* Line Heights */
  --leading-tight: 1.3;    /* Headings */
  --leading-normal: 1.6;   /* Body text */
}
```

## Usage in Code

```jsx
// Using semantic tokens
<section style={{ marginBottom: 'var(--section-gap)' }}>
  <div style={{ marginBottom: 'var(--section-header-gap)' }}>
    <h2 style={{
      lineHeight: 'var(--leading-tight)',
      marginBottom: 'var(--h2-to-description)'
    }}>
      Title
    </h2>
    <p style={{ lineHeight: 'var(--leading-normal)' }}>
      Description
    </p>
  </div>

  <div style={{ marginBottom: 'var(--subsection-gap)' }}>
    <h3 style={{ marginBottom: 'var(--h3-to-content)' }}>
      Subsection
    </h3>
    <div style={{ gap: 'var(--grid-gap-standard)' }}>
      {/* Content */}
    </div>
  </div>
</section>
```

## Spacing Validation Checklist

✅ **Page Container**
- Top padding: 64px
- Bottom padding: 96px

✅ **Section Spacing**
- Between sections: 80px
- Section header to first subsection: 48px
- Between subsections: 56px
- Last subsection: 0px bottom margin

✅ **Header Spacing**
- H2 to description: 16px
- H3 to content grid: 24px

✅ **Grid Gaps**
- Color grids: 24px
- Radius grids: 32px
- Consistent within same content type

✅ **Card Internal**
- Swatch to title: 16px
- Title to hex: 8px
- Hex to usage: 8px
- Proper conditional spacing

✅ **Line Heights**
- H2: 1.3 (130%)
- H3: 1.35 (135%)
- Body: 1.6 (160%)

## Benefits Achieved

1. **Mathematical Consistency**: All spacing is 8px × n
2. **Visual Rhythm**: Regular intervals create calm scanning
3. **Clear Hierarchy**: Different spacing levels indicate relationships
4. **Maintainable**: Simple rules, easy to remember and apply
5. **Scalable**: System works across all screen sizes
6. **Accessibility**: Generous spacing aids comprehension

## Before vs After

### ❌ Before (Inconsistent)
```
Section header → content: 32px
Subsection → subsection: 40px
H3 → grid: 18px
Card spacing: random (12px, 16px, 20px)
Line height: inconsistent (1.2-1.8)
```

### ✅ After (Systematic)
```
Section header → content: 48px ✓
Subsection → subsection: 56px ✓
H3 → grid: 24px ✓
Card spacing: 16px/8px (swatch/labels) ✓
Line height: 1.3/1.6 (heading/body) ✓
All values on 8px grid ✓
```

## Quick Reference

| Element Relationship | Spacing | Visual Weight |
|---------------------|---------|---------------|
| Section → Section | 80px | ████████████ |
| Header → Subsection | 48px | ████████ |
| Subsection → Subsection | 56px | █████████ |
| H3 → Grid | 24px | ████ |
| H2 → P | 16px | ███ |
| Swatch → Title | 16px | ███ |
| Label → Value | 8px | ██ |

This creates a clear visual hierarchy where larger gaps = less relationship, smaller gaps = more relationship.
