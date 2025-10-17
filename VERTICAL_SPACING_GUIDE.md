# Vertical Spacing & Rhythm Guide

This guide explains how to implement the vertical spacing system for a clean, readable, and modern UI.

## Core Principles

### 1. **8px Grid System**
All vertical spacing follows 8px increments for mathematical consistency and visual harmony:
- 8px, 16px, 24px, 32px, 48px, 64px, 96px, 128px, 160px, 192px

### 2. **Line Height Standards**
- **Headings**: 135-140% (1.35-1.4) - tight for visual impact
- **Subheadings**: 145-150% (1.45-1.5) - balanced density
- **Body Text**: 160% (1.6) - optimal readability
- **Featured Content**: 175% (1.75) - maximum breathing room

### 3. **Spacing Hierarchy**
- Smaller gaps for related items
- Larger gaps for distinct sections
- Consistent spacing creates visual groups

## CSS Variables

### Base Spacing Scale (8px increments)
```css
--space-2: 0.5rem;       /* 8px - base unit */
--space-4: 1rem;         /* 16px - 2×base */
--space-6: 1.5rem;       /* 24px - 3×base */
--space-8: 2rem;         /* 32px - 4×base */
--space-12: 3rem;        /* 48px - 6×base */
--space-16: 4rem;        /* 64px - 8×base */
--space-24: 6rem;        /* 96px - 12×base */
--space-32: 8rem;        /* 128px - 16×base */
```

### Semantic Spacing Tokens
```css
--spacing-text-block: var(--space-4);        /* 16px - between paragraphs */
--spacing-content-group: var(--space-8);     /* 32px - between related content */
--spacing-section-gap: var(--space-16);      /* 64px - between sections */
--spacing-section-large: var(--space-24);    /* 96px - major section breaks */
--spacing-heading-top: var(--space-12);      /* 48px - space above heading */
--spacing-heading-bottom: var(--space-6);    /* 24px - space below heading */
--spacing-card-gap: var(--space-8);          /* 32px - between cards */
--spacing-card-padding: var(--space-6);      /* 24px - inside cards */
--spacing-component-gap: var(--space-6);     /* 24px - between UI components */
```

## Line Height Guidelines

### Typography Setup
```css
/* Headings */
h1, h2, h3, h4, h5, h6 {
  line-height: var(--leading-tight);  /* 1.35 */
  margin-top: var(--spacing-heading-top);
  margin-bottom: var(--spacing-heading-bottom);
}

/* First heading in container - no top margin */
h1:first-child, h2:first-child, h3:first-child {
  margin-top: 0;
}

/* Specific line heights */
h1 { line-height: 1.25; }  /* 125% - maximum impact */
h2 { line-height: 1.3; }   /* 130% */
h3 { line-height: 1.35; }  /* 135% */
h4 { line-height: 1.4; }   /* 140% */
h5 { line-height: 1.45; }  /* 145% */
h6 { line-height: 1.5; }   /* 150% */

/* Body text */
p {
  line-height: var(--leading-normal);  /* 1.6 = 160% */
  margin-bottom: var(--spacing-text-block);
}

p:last-child {
  margin-bottom: 0;
}

/* Lists */
ul, ol {
  line-height: var(--leading-normal);  /* 1.6 */
  margin-bottom: var(--spacing-text-block);
  padding-left: var(--space-6);
}

li {
  margin-bottom: var(--space-2);  /* 8px between list items */
}
```

## Utility Classes

### Stack Layout (Vertical Spacing Between Children)
Automatically adds spacing between child elements:

```css
.stack-xs > * + * { margin-top: 8px; }    /* Minimal gap */
.stack-sm > * + * { margin-top: 16px; }   /* Small gap */
.stack-md > * + * { margin-top: 24px; }   /* Medium gap */
.stack-lg > * + * { margin-top: 32px; }   /* Large gap */
.stack-xl > * + * { margin-top: 48px; }   /* Extra large gap */
.stack-2xl > * + * { margin-top: 64px; }  /* Section-level gap */
```

### Section Spacing
```css
.section-spacing { margin-bottom: 64px; }        /* Standard section gap */
.section-spacing-large { margin-bottom: 96px; }  /* Large section gap */
```

### Content Groups
```css
.content-group { margin-bottom: 32px; }  /* Related content */
```

### Card Layouts
```css
.card-gap { gap: 32px; }              /* Gap between cards */
.card-padding { padding: 24px; }      /* Standard card padding */
.card-padding-lg { padding: 32px; }   /* Large card padding */
.card-padding-xl { padding: 48px; }   /* Extra large card padding */
```

### Component Spacing
```css
.component-gap { gap: 24px; }  /* Between UI components */
```

### Form Spacing
```css
.form-field {
  margin-bottom: var(--spacing-component-gap);  /* 24px */
}

.form-field:last-child {
  margin-bottom: 0;
}
```

## Usage Examples

### Example 1: Card Component
```jsx
<div className="card-padding">
  <h3 style={{ lineHeight: '1.4' }} className="mb-4">
    Card Title
  </h3>
  <p style={{ lineHeight: '1.6' }} className="mb-6">
    Card description with proper line height for readability.
  </p>
  <button>Action</button>
</div>
```

### Example 2: Page Section
```jsx
<section className="section-spacing-large">
  <div className="mb-16">
    <h2 className="mb-6" style={{ lineHeight: '1.3' }}>
      Section Heading
    </h2>
    <p style={{ lineHeight: '1.6' }}>
      Section introduction with comfortable line height.
    </p>
  </div>

  <div className="content-group">
    {/* Related content */}
  </div>
</section>
```

### Example 3: Form Layout
```jsx
<form className="stack-lg max-w-md">
  <div className="form-field">
    <label className="block mb-2">Email</label>
    <input type="email" className="w-full h-12" />
  </div>

  <div className="form-field">
    <label className="block mb-2">Password</label>
    <input type="password" className="w-full h-12" />
  </div>

  <button className="min-h-[44px]">Submit</button>
</form>
```

### Example 4: Grid with Cards
```jsx
<div className="grid md:grid-cols-3 card-gap">
  <div className="card-padding bg-white rounded-xl">
    <h3 className="mb-4" style={{ lineHeight: '1.4' }}>Card 1</h3>
    <p style={{ lineHeight: '1.6' }}>Content</p>
  </div>
  {/* More cards... */}
</div>
```

## Visual Spacing Rules

### Between Text Elements
- **Paragraph to paragraph**: 16px (`--spacing-text-block`)
- **Heading to content**: 24px (`--spacing-heading-bottom`)
- **Content to heading**: 48px (`--spacing-heading-top`)

### Between Components
- **Form fields**: 24px (`--spacing-component-gap`)
- **Buttons in group**: 12-16px (use gap utilities)
- **Cards in grid**: 32px (`--spacing-card-gap`)

### Between Sections
- **Related sections**: 64px (`--spacing-section-gap`)
- **Major breaks**: 96px (`--spacing-section-large`)

### Inside Components
- **Card padding**: 24px (`--spacing-card-padding`)
- **Large card padding**: 32px (`card-padding-lg`)
- **Button padding**: 12px vertical, 2em horizontal (em-based)
- **Input padding**: 12px vertical, 1.25em horizontal

## Accessibility Considerations

### WCAG Requirements
- **Minimum line height**: 1.5× font size for body text (we use 1.6)
- **Paragraph spacing**: At least 2× font size (we use 1× font size as standard, which is 16px for 16px font)
- **Touch targets**: Minimum 44×44px for interactive elements
- **Focus indicators**: Visible 2px outline with 2px offset

### Best Practices
1. **Never go below 1.4 line height** for readability
2. **Use 1.6 (160%) for body text** to reduce eye strain
3. **Maintain consistent spacing** across similar components
4. **Group related items** with smaller gaps
5. **Separate distinct sections** with larger gaps

## Responsive Adjustments

### Mobile Spacing
On smaller screens, consider reducing section spacing:

```css
@media (max-width: 768px) {
  .section-spacing-large {
    margin-bottom: 64px;  /* Reduced from 96px */
  }

  .card-padding-xl {
    padding: 32px;  /* Reduced from 48px */
  }
}
```

## Quick Reference Table

| Use Case | Spacing | CSS Variable |
|----------|---------|--------------|
| Between paragraphs | 16px | `--spacing-text-block` |
| Between related content | 32px | `--spacing-content-group` |
| Between sections | 64px | `--spacing-section-gap` |
| Major section breaks | 96px | `--spacing-section-large` |
| Above headings | 48px | `--spacing-heading-top` |
| Below headings | 24px | `--spacing-heading-bottom` |
| Card gap in grid | 32px | `--spacing-card-gap` |
| Card internal padding | 24px | `--spacing-card-padding` |
| Between components | 24px | `--spacing-component-gap` |

## Line Height Quick Reference

| Element | Line Height | Percentage | Usage |
|---------|-------------|------------|-------|
| h1 | 1.25 | 125% | Maximum impact |
| h2 | 1.3 | 130% | Primary headings |
| h3 | 1.35 | 135% | Section headings |
| h4 | 1.4 | 140% | Subsections |
| h5 | 1.45 | 145% | Minor headings |
| h6 | 1.5 | 150% | Small headings |
| p, body | 1.6 | 160% | Body text |
| Featured | 1.75 | 175% | Emphasized content |

## Common Mistakes to Avoid

❌ **Don't:**
- Use line heights below 1.4 for body text
- Stack elements with inconsistent spacing
- Mix pixel values outside the 8px grid
- Forget to remove bottom margin from last child
- Use the same spacing for unrelated elements

✅ **Do:**
- Follow the 8px grid system consistently
- Use semantic spacing tokens for clarity
- Apply 1.6 line height to all body text
- Group related items with smaller gaps
- Separate sections with larger gaps
- Remove margins from first/last children

## Figma Configuration

To replicate in Figma:

1. **Auto Layout Spacing**:
   - Small: 8px
   - Medium: 16px
   - Large: 24px
   - XL: 32px
   - 2XL: 48px
   - 3XL: 64px

2. **Line Height**:
   - Tight: 135%
   - Snug: 150%
   - Normal: 160%
   - Relaxed: 175%

3. **Section Spacing**:
   - Between components: 24px
   - Between content groups: 32px
   - Between sections: 64px
   - Between major areas: 96px
