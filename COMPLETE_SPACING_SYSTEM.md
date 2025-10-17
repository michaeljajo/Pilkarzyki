# Complete Spacing System - Vertical & Horizontal

## System Overview

The Pilkarzyki Design System uses a **strict 8px modular grid** for all spacing (vertical and horizontal) to create visual harmony, predictable layouts, and a premium user experience.

## 📏 Core Spacing Scale

```
8px   = --space-2  = --gap-xs
16px  = --space-4  = --gap-sm
24px  = --space-6  = --gap-md
32px  = --space-8  = --gap-lg
40px  = --space-10 = --gap-xl
48px  = --space-12 = --gap-2xl
56px  = --space-14
64px  = --space-16
80px  = --space-20
96px  = --space-24
```

## 🔲 Vertical Spacing

### Hierarchy (Top to Bottom)

```
1. Section → Section           80px  (major breaks)
2. Section Header → Content    48px  (after H2 + description)
3. Subsection → Subsection     56px  (within section)
4. H3 → Content Grid           24px  (subsection to content)
5. H2 → Description            16px  (heading to paragraph)
6. Card Internal               16px/8px (swatch/labels)
```

### Implementation

```css
/* Sections */
section {
  margin-bottom: 80px;
}

/* Section Header */
.section-header {
  margin-bottom: 48px;
}

.section-header h2 {
  line-height: 1.3;
  margin-bottom: 16px;
}

/* Subsections */
.subsection {
  margin-bottom: 56px;
}

.subsection:last-child {
  margin-bottom: 0;  /* Critical! */
}

.subsection h3 {
  margin-bottom: 24px;
}
```

### Typography Line Heights

```css
H2:       1.3  (130% - tight for impact)
H3:       1.35 (135% - balanced)
Body (P): 1.6  (160% - comfortable reading)
```

## ↔️ Horizontal Spacing

### Container Margins (Responsive)

```css
/* Mobile (< 768px) */
padding-left/right: 16px;

/* Tablet (769px - 1024px) */
padding-left/right: 24px;

/* Desktop (1025px - 1439px) */
padding-left/right: 32px;

/* Wide Screen (≥ 1440px) */
padding-left/right: 48px;
```

### Grid & Component Gaps

```css
/* Grids */
Color swatches:     24-32px gap
Cards:              32px gap
Radius examples:    40px gap
Icon grids:         24px gap

/* Components */
Button groups:      24px gap
Badge groups:       16px gap
Form fields:        24px gap
Nav items:          32px gap
```

### Utility Classes

```css
/* Gap utilities (flex & grid) */
.gap-xs   { gap: 8px; }
.gap-sm   { gap: 16px; }
.gap-md   { gap: 24px; }
.gap-lg   { gap: 32px; }
.gap-xl   { gap: 40px; }
.gap-2xl  { gap: 48px; }

/* Container padding */
.container-padding {
  padding-left: 32px;   /* Desktop default */
  padding-right: 32px;
}
```

## 📐 Complete Page Layout

```
┌──────────────────────────────────────────────────────────┐
│ ←32px→                                           ←32px→  │
│        ╔════════════════════════════════════╗            │
│  64px  ║ Page Content (max-width: 1536px)  ║            │
│   ↓    ║                                    ║            │
│        ║  ┌─────────────────────────────┐   ║            │
│        ║  │ Section (80px bottom)       │   ║            │
│        ║  │                             │   ║            │
│        ║  │  H2 + Description           │   ║            │
│        ║  │  ↓ 48px                     │   ║            │
│        ║  │                             │   ║            │
│        ║  │  ┌─────────────────────┐    │   ║            │
│        ║  │  │ Subsection (56px ↓) │    │   ║            │
│        ║  │  │                     │    │   ║            │
│        ║  │  │ H3                  │    │   ║            │
│        ║  │  │ ↓ 24px              │    │   ║            │
│        ║  │  │                     │    │   ║            │
│        ║  │  │ Grid (32px gap)     │    │   ║            │
│        ║  │  │ ┌───┐ ←32px→ ┌───┐  │    │   ║            │
│        ║  │  │ │ ↓ │        │   │  │    │   ║            │
│        ║  │  │ │16 │        │   │  │    │   ║            │
│        ║  │  │ │ ↓ │        │   │  │    │   ║            │
│        ║  │  │ │8px│        │   │  │    │   ║            │
│        ║  │  │ └───┘        └───┘  │    │   ║            │
│        ║  │  └─────────────────────┘    │   ║            │
│        ║  └─────────────────────────────┘   ║            │
│        ║  ↓ 80px                            ║            │
│        ║                                    ║            │
│        ║  Next Section...                  ║            │
│        ╚════════════════════════════════════╝            │
│   ↓                                                      │
│  96px                                                    │
└──────────────────────────────────────────────────────────┘
```

## 🎨 Design Tokens

```css
:root {
  /* Vertical Spacing */
  --section-gap: 80px;
  --section-header-gap: 48px;
  --subsection-gap: 56px;
  --h3-gap: 24px;
  --h2-gap: 16px;
  --card-internal-gap: 16px;
  --label-gap: 8px;

  /* Horizontal Spacing */
  --container-padding-mobile: 16px;
  --container-padding-tablet: 24px;
  --container-padding-desktop: 32px;
  --container-padding-wide: 48px;

  /* Universal Gaps */
  --gap-xs: 8px;
  --gap-sm: 16px;
  --gap-md: 24px;
  --gap-lg: 32px;
  --gap-xl: 40px;
  --gap-2xl: 48px;

  /* Line Heights */
  --lh-heading: 1.3;
  --lh-body: 1.6;
}
```

## 💻 React Implementation Examples

### Complete Page Structure
```jsx
<div className="min-h-screen">
  {/* Header */}
  <header className="sticky top-0">
    <div className="max-w-[1536px] mx-auto container-padding py-8">
      <h1>Design System</h1>
    </div>
  </header>

  {/* Main Content */}
  <div className="max-w-[1536px] mx-auto container-padding"
       style={{ paddingTop: '64px', paddingBottom: '96px' }}>

    {/* Section */}
    <section style={{ marginBottom: '80px' }}>
      {/* Section Header */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ lineHeight: '1.3', marginBottom: '16px' }}>
          Color System
        </h2>
        <p style={{ lineHeight: '1.6' }}>
          Our color palette description.
        </p>
      </div>

      {/* Subsection */}
      <div style={{ marginBottom: '56px' }}>
        <h3 style={{ marginBottom: '24px' }}>
          PRIMARY COLORS
        </h3>
        <div className="grid grid-cols-4 gap-lg">
          <ColorCard />
          <ColorCard />
          <ColorCard />
          <ColorCard />
        </div>
      </div>

      {/* Last Subsection */}
      <div>
        <h3 style={{ marginBottom: '24px' }}>
          TEAL PALETTE
        </h3>
        <div className="grid grid-cols-5 gap-md">
          {/* Cards */}
        </div>
      </div>
    </section>
  </div>
</div>
```

### Component Grids
```jsx
// Color Grid - 4 columns, 32px gap
<div className="grid grid-cols-4 gap-lg">
  <ColorCard />
</div>

// Card Grid - 3 columns, 32px gap
<div className="grid md:grid-cols-3 gap-lg">
  <Card />
</div>

// Button Group - flex, 24px gap
<div className="flex flex-wrap gap-md">
  <button>Primary</button>
  <button>Secondary</button>
</div>

// Badge Group - flex, 16px gap
<div className="flex flex-wrap gap-sm">
  <Badge />
  <Badge />
</div>
```

### Card Component
```jsx
function ColorCard({ name, hex, usage }) {
  return (
    <div>
      {/* Swatch */}
      <div
        style={{
          height: '128px',
          backgroundColor: hex,
          marginBottom: '16px'
        }}
      />

      {/* Title */}
      <p style={{ marginBottom: '8px' }}>
        {name}
      </p>

      {/* Hex */}
      <p style={{ marginBottom: '8px' }}>
        {hex}
      </p>

      {/* Usage */}
      {usage && (
        <p style={{ marginTop: '8px' }}>
          {usage}
        </p>
      )}
    </div>
  )
}
```

## 🎯 Figma Configuration

### Auto Layout Settings

#### Page Container
- **Padding**:
  - Mobile: 16px left/right
  - Desktop: 32px left/right
  - Wide: 48px left/right
- **Max width**: 1536px
- **Padding top**: 64px
- **Padding bottom**: 96px

#### Section
- **Direction**: Vertical
- **Spacing**: 80px bottom
- **Internal gaps**:
  - Header to content: 48px
  - Subsection to subsection: 56px

#### Subsection
- **Direction**: Vertical
- **H3 to grid**: 24px
- **Bottom margin**: 56px (0 for last)

#### Grids
- **Primary Colors**: 4 columns, 32px gap
- **Semantic Colors**: 6 columns, 24px gap
- **Cards**: 3 columns, 32px gap
- **Radius**: 4 columns, 40px gap

#### Card Internal
- **Swatch to title**: 16px
- **Title to hex**: 8px
- **Hex to usage**: 8px

## ✅ Validation Checklist

### Vertical Spacing
- [ ] Sections: 80px apart
- [ ] Section headers: 48px to content
- [ ] Subsections: 56px apart
- [ ] H3: 24px to grid
- [ ] H2: 16px to description
- [ ] Last subsection: 0px margin
- [ ] Line heights: 1.3 (headings), 1.6 (body)

### Horizontal Spacing
- [ ] Container padding: 32px (desktop)
- [ ] Responsive padding: 16px (mobile), 48px (wide)
- [ ] Color grids: 24-32px gap
- [ ] Card grids: 32px gap
- [ ] Button groups: 24px gap
- [ ] Badge groups: 16px gap
- [ ] No elements touch viewport edges

### Universal
- [ ] All spacing uses 8px increments
- [ ] Grid layouts have defined gaps
- [ ] Flex containers have gap property
- [ ] Related items: smaller gaps (16-24px)
- [ ] Unrelated groups: larger gaps (40-48px)

## 📊 Quick Reference Tables

### Vertical Spacing
| Element Relationship | Spacing | Use |
|---------------------|---------|-----|
| Section → Section | 80px | Major breaks |
| Header → Content | 48px | After H2 block |
| Subsection → Subsection | 56px | Within section |
| H3 → Grid | 24px | Tight connection |
| H2 → P | 16px | Close relationship |
| Card Internal | 16px/8px | Swatch/labels |

### Horizontal Spacing
| Element Type | Gap | Context |
|--------------|-----|---------|
| Color swatches | 24-32px | Grid layout |
| Cards | 32px | Grid layout |
| Buttons | 24px | Flex group |
| Badges | 16px | Flex group |
| Icons | 24px | Grid layout |
| Nav items | 32px | Flex layout |

### Container Padding
| Screen Size | Padding |
|-------------|---------|
| Mobile (< 768px) | 16px |
| Tablet (769-1024px) | 24px |
| Desktop (1025-1439px) | 32px |
| Wide (≥ 1440px) | 48px |

## 🚀 Benefits

### Visual
1. **Calm & Balanced**: Regular rhythm prevents jarring transitions
2. **Easy Scanning**: Clear hierarchy guides the eye
3. **Premium Feel**: Generous whitespace signals quality
4. **Modern Aesthetic**: Open, breathable layouts

### Functional
5. **Consistent**: Mathematical system (8px × n)
6. **Predictable**: Same rules apply everywhere
7. **Maintainable**: Simple to remember and apply
8. **Scalable**: Works across all screen sizes

### Accessibility
9. **Readable**: 1.6 line height for body text
10. **Comprehensible**: Adequate spacing aids understanding
11. **Touch-Friendly**: Sufficient gaps for interaction
12. **Inclusive**: Meets WCAG standards

## ❌ Common Mistakes to Avoid

**Vertical:**
- Using arbitrary values (18px, 37px, 42px)
- Forgetting last-child margin removal
- Compressing line heights below 1.3
- Inconsistent subsection spacing

**Horizontal:**
- Elements touching viewport edges
- Inconsistent grid gaps
- Forgetting responsive padding
- Same gap for all content types

**Universal:**
- Not using the 8px grid
- Missing gap on flex/grid containers
- Ignoring the spacing hierarchy
- Not testing on mobile

## 📝 Summary

This spacing system creates a **visually calm, balanced, and professional** design through:

1. **8px Modular Grid**: All spacing is 8px × n
2. **Vertical Hierarchy**: 6 levels (80px → 8px)
3. **Horizontal Scale**: 6 levels (8px → 48px)
4. **Responsive Margins**: Adapts to screen size
5. **Consistent Gaps**: Defined for all layouts
6. **Premium Whitespace**: Generous breathing room

**Result**: A unified, modern, and easy-to-scan layout that provides an exceptional user experience across all devices and components.
