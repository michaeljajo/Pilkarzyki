# Pilkarzyki Spacing System Guide

This document defines the complete spacing system used across all pages in the Pilkarzyki application, derived from the Style Guide page (`/style-guide`).

## Core Principles

1. **8px Grid System**: All vertical spacing follows 8px increments
2. **Consistent Horizontal Margins**: 48px container padding on desktop
3. **Predictable Vertical Rhythm**: Standardized spacing between elements
4. **Responsive Scaling**: Spacing adapts fluidly across breakpoints

---

## Horizontal Spacing (Container Margins)

### Container Padding - Left/Right Margins

**These values should be applied to ALL pages via the main content container.**

| Breakpoint | Padding | Token | Usage |
|------------|---------|-------|-------|
| Mobile (< 768px) | 24px | `--container-padding-mobile` | Minimum safe area on small screens |
| Tablet (768px - 1024px) | 32px | `--container-padding-tablet` | Comfortable breathing room on tablets |
| Desktop (> 1024px) | **48px** | `--container-padding-desktop` | **Style Guide Standard** |
| Wide (> 1440px) | **48px** | `--container-padding-wide` | Maintains Style Guide consistency |

### Implementation

#### Option 1: Using PageContainer Component (Recommended)

```tsx
import { PageContainer } from '@/components/layout/PageContainer'

export default function MyPage() {
  return (
    <PageContainer>
      {/* Your content */}
    </PageContainer>
  )
}
```

#### Option 2: Using Utility Classes

```tsx
<div className="container-padding">
  {/* Applies responsive padding automatically */}
</div>
```

#### Option 3: Using Inline Styles (Style Guide Pattern)

```tsx
<div className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
  {/* Desktop pattern - wrap in responsive container for mobile */}
</div>
```

---

## Vertical Spacing (Page Structure)

### Page Level Spacing

| Element | Spacing | Token | Value | Usage |
|---------|---------|-------|-------|-------|
| **Page Top Padding** | 64px | `pt-16` | | Space below navigation before content |
| **Page Bottom Padding** | 96px | `pb-24` | | Space before footer |
| **Section Spacing** | 80px | `--spacing-section-large` | `mb-20` | Between major sections |
| **Section Spacing (compact)** | 64px | `--spacing-section-gap` | `mb-16` | Between minor sections |

### Header Spacing

| Element | Spacing | Token | Value | CSS Class |
|---------|---------|-------|-------|-----------|
| **Main Page Header Below** | 48px | `--spacing-heading-top` | | `mb-12` |
| **Section Header Below** | 48px | `--spacing-heading-top` | | `mb-12` |
| **Subsection Header Below** | 24px | `--spacing-heading-bottom` | | `mb-6` |
| **Header Title → Description** | 16px | `--space-4` | | `mb-4` |

### Content Spacing

| Element | Spacing | Token | Value | CSS Class |
|---------|---------|-------|-------|-----------|
| **Content Group Spacing** | 56px | | | `mb-14` |
| **Component Spacing** | 32px | `--spacing-content-group` | | `mb-8` |
| **Paragraph Spacing** | 16px | `--spacing-text-block` | | `mb-4` |
| **List Items** | 8px | `--space-2` | | `mb-2` |

---

## Grid Spacing

### Card Grids

**Standard Card Grid** (Used in Style Guide for color palettes, cards, etc.)

| Type | Column Gap | Row Gap | Usage |
|------|------------|---------|-------|
| **Primary Grid** | 32px | 32px | Default card layouts |
| **Secondary Grid** | 24px | 24px | Denser layouts (badges, small cards) |

#### Implementation

```tsx
// Using CardGrid component
<CardGrid cols={3}>
  {/* Cards */}
</CardGrid>

// Using inline styles (Style Guide pattern)
<div className="grid grid-cols-3" style={{ columnGap: '32px', rowGap: '32px' }}>
  {/* Cards */}
</div>

// Using utility classes
<div className="grid grid-cols-3 gap-8">
  {/* 32px gaps via Tailwind */}
</div>
```

---

## Component Internal Spacing

### Card Padding

| Size | Padding | Token | Usage |
|------|---------|-------|-------|
| **Default** | 24px | `--spacing-card-padding` | Standard card internal padding |
| **Large** | 32px | `--space-8` | Feature cards, important content |
| **Extra Large** | 48px | `--space-12` | Hero cards, large content blocks |

### Button Horizontal Padding

Uses **em-based** padding that scales with font size:

| Size | Padding | Font Size |
|------|---------|-----------|
| Small | 1.5em (≈18px) | 12px |
| Medium | 2em (≈28px) | 14px |
| Large | 2.5em (≈40px) | 16px |

### Form Input Padding

| Element | Horizontal | Vertical |
|---------|-----------|----------|
| Text Input | 1.25em | Auto (height: 48px) |
| Textarea | 1.25em | 0.875em |
| Select | 1.25em | Auto (height: 48px) |

---

## Responsive Breakpoints

```css
/* Mobile First Approach */
@media (max-width: 768px) {
  .container-padding {
    padding-left: 24px;  /* --container-padding-mobile */
    padding-right: 24px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .container-padding {
    padding-left: 32px;  /* --container-padding-tablet */
    padding-right: 32px;
  }
}

@media (min-width: 1025px) {
  .container-padding {
    padding-left: 48px;  /* --container-padding-desktop */
    padding-right: 48px;
  }
}
```

---

## Layout Components Reference

### Available Components

1. **`<PageContainer>`** - Main page wrapper with standard spacing
2. **`<PageHeader>`** - Page title + description with proper spacing
3. **`<PageSection>`** - Section wrapper with 80px bottom margin
4. **`<SectionHeader>`** - Section title with 48px bottom margin
5. **`<SubsectionHeader>`** - Small header with 24px bottom margin
6. **`<CardGrid>`** - Grid layout with 32px gaps

### Example Page Structure

```tsx
import {
  PageContainer,
  PageHeader,
  PageSection,
  SectionHeader,
  SubsectionHeader,
  CardGrid
} from '@/components/layout/PageContainer'

export default function ExamplePage() {
  return (
    <PageContainer>
      {/* Page Header: 48px bottom margin */}
      <PageHeader
        title="Page Title"
        description="Page description with proper line height"
      />

      {/* Section: 80px bottom margin */}
      <PageSection>
        {/* Section Header: 48px bottom margin */}
        <SectionHeader
          title="Section Title"
          description="Section description"
        />

        {/* Subsection: 56px bottom margin */}
        <div className="mb-14">
          {/* Subsection Header: 24px bottom margin */}
          <SubsectionHeader title="Subsection Title" />

          {/* Card Grid: 32px column/row gaps */}
          <CardGrid cols={3}>
            <Card />
            <Card />
            <Card />
          </CardGrid>
        </div>
      </PageSection>

      {/* Another Section */}
      <PageSection>
        {/* Content */}
      </PageSection>
    </PageContainer>
  )
}
```

---

## Quick Reference Table

### Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--container-padding-desktop` | **48px** | ⭐ **Main container left/right padding** |
| `--spacing-section-large` | 96px | Between major page sections |
| `--spacing-section-gap` | 64px | Between minor sections |
| `--spacing-heading-top` | 48px | Space above headings |
| `--spacing-heading-bottom` | 24px | Space below headings |
| `--spacing-content-group` | 32px | Between related content blocks |
| `--spacing-card-gap` | 32px | Between cards in grids |
| `--spacing-card-padding` | 24px | Inside cards |
| `--spacing-component-gap` | 24px | Between UI components |
| `--spacing-text-block` | 16px | Between paragraphs |

---

## Tailwind Utility Classes

### Spacing Classes (Using 8px Grid)

| Class | Value | Rem | Token |
|-------|-------|-----|-------|
| `space-2` | 8px | 0.5rem | `--space-2` |
| `space-4` | 16px | 1rem | `--space-4` |
| `space-6` | 24px | 1.5rem | `--space-6` |
| `space-8` | 32px | 2rem | `--space-8` |
| `space-12` | 48px | 3rem | `--space-12` |
| `space-16` | 64px | 4rem | `--space-16` |
| `space-20` | 80px | 5rem | `--space-20` |
| `space-24` | 96px | 6rem | `--space-24` |

### Common Margin/Padding Classes

```tsx
// Margin Bottom
mb-4  → 16px  (paragraph spacing)
mb-6  → 24px  (subsection header)
mb-8  → 32px  (content group)
mb-12 → 48px  (section header)
mb-14 → 56px  (subsection spacing)
mb-16 → 64px  (section compact)
mb-20 → 80px  (section standard)
mb-24 → 96px  (page bottom)

// Padding
px-6  → 24px left/right (mobile)
px-8  → 32px left/right (tablet)
px-12 → 48px left/right (desktop) ⭐
pt-16 → 64px top (page top)
pb-24 → 96px bottom (page bottom)

// Gaps (for flexbox/grid)
gap-6 → 24px (secondary grid)
gap-8 → 32px (primary grid) ⭐
```

---

## Migration Checklist

When updating existing pages to use the Style Guide spacing:

### ✅ Horizontal Spacing
- [ ] Replace custom padding with `<PageContainer>` or `container-padding` class
- [ ] Ensure max-width is set to 1400px
- [ ] Verify 48px horizontal padding on desktop
- [ ] Test responsive padding on tablet (32px) and mobile (24px)

### ✅ Vertical Spacing
- [ ] Add 64px top padding (`pt-16`)
- [ ] Add 96px bottom padding (`pb-24`)
- [ ] Use 80px spacing between major sections (`mb-20`)
- [ ] Use 48px spacing below headers (`mb-12`)
- [ ] Use 24px spacing below subsection headers (`mb-6`)

### ✅ Grid Spacing
- [ ] Use 32px column/row gaps for card grids
- [ ] Use 24px gaps for denser layouts
- [ ] Ensure cards have 24px internal padding

### ✅ Component Spacing
- [ ] Use semantic spacing tokens from design-tokens.css
- [ ] Maintain 8px grid alignment
- [ ] Test all breakpoints

---

## Testing Checklist

- [ ] Spacing looks identical to Style Guide page at 1920px width
- [ ] Spacing scales properly on tablet (768px - 1024px)
- [ ] Spacing comfortable on mobile (< 768px)
- [ ] No horizontal scrollbars at any breakpoint
- [ ] Content never touches viewport edges
- [ ] Vertical rhythm feels consistent throughout page
- [ ] Grid gaps are uniform
- [ ] Card padding matches Style Guide

---

## Common Mistakes to Avoid

❌ **Don't**:
- Use arbitrary spacing values (e.g., `margin: 17px`)
- Mix px and rem units inconsistently
- Apply padding directly on `<main>` tag (use wrapper div)
- Use different horizontal padding values across pages
- Break the 8px vertical rhythm grid

✅ **Do**:
- Use spacing tokens from `design-tokens.css`
- Maintain 48px horizontal padding on desktop
- Follow the 8px grid for vertical spacing
- Use layout components for consistency
- Test across all breakpoints

---

## Resources

- **Style Guide Page**: `/style-guide` - Visual reference for all spacing
- **Design Tokens**: `src/app/design-tokens.css` - CSS variable definitions
- **Layout Components**: `src/components/layout/PageContainer.tsx`
- **Global Styles**: `src/app/globals.css` - Utility classes

---

**Last Updated**: 2025-10-03
**Maintained By**: Design System Team
