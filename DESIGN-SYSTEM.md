# FlickDay Media Design System

## Brand Identity
- **Tagline**: "Every day's a Flickday"
- **Mission**: Grassroots sports media — raw, fast, and player-first
- **Voice**: Authentic, energetic, player-focused

---

## Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Black | `#000000` | Primary background |
| Rich Black | `#0a0a0f` | Card backgrounds |
| Flickday Yellow | `#facc15` | Primary accent, CTAs, highlights |
| Yellow Hover | `#fde047` | Hover states |

### Neutral Colors
| Name | Hex | Usage |
|------|-----|-------|
| White | `#ffffff` | Primary text |
| Gray 300 | `#d1d5db` | Secondary text |
| Gray 500 | `#6b7280` | Muted text, borders |
| Gray 700 | `#374151` | Subtle borders |
| Gray 900 | `#111827` | Card backgrounds |

### Status Colors
| Name | Hex | Usage |
|------|-----|-------|
| Live Green | `#22c55e` | "Now Booking" indicators |
| Event Orange | `#f97316` | Event highlights |

---

## Typography

### Font Stack
```css
--font-display: 'Bebas Neue', sans-serif;  /* Headlines */
--font-body: 'Inter', sans-serif;           /* Body text */
--font-mono: 'JetBrains Mono', monospace;   /* Labels, tags */
```

### Type Scale
| Element | Size (Desktop) | Size (Mobile) | Weight | Line Height |
|---------|---------------|---------------|--------|-------------|
| Hero H1 | 8rem (128px) | 4rem (64px) | 400 | 0.85 |
| Section H2 | 4rem (64px) | 2.5rem (40px) | 700 | 1.1 |
| Card H3 | 1.5rem (24px) | 1.25rem (20px) | 600 | 1.2 |
| Body Large | 1.125rem (18px) | 1rem (16px) | 400 | 1.6 |
| Body | 1rem (16px) | 0.875rem (14px) | 400 | 1.5 |
| Label | 0.75rem (12px) | 0.625rem (10px) | 500 | 1.4 |

### Typography Rules
- Headlines: ALL CAPS for display font (Bebas Neue)
- Body: Sentence case
- Labels/Tags: UPPERCASE with letter-spacing: 0.1em
- No emoji in body copy; use sparingly in UI elements only

---

## Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-24: 6rem;     /* 96px */
```

### Section Spacing
- Section padding: `py-24` (96px vertical)
- Max content width: `1280px` (7xl)
- Mobile padding: `px-6` (24px)
- Desktop padding: `px-12` (48px)

---

## Component Patterns

### Cards (Bento Grid)
```css
.bento-card {
  background: #0a0a0f;
  border: 1px solid #374151;
  transition: border-color 0.3s ease;
}
.bento-card:hover {
  border-color: #facc15;
}
```

### Buttons
**Primary (Yellow)**
```css
.btn-primary {
  background: #facc15;
  color: #000000;
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: #ffffff;
}
```

**Secondary (Ghost)**
```css
.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.3);
  color: #ffffff;
  padding: 0.75rem 1.5rem;
  transition: all 0.2s;
}
.btn-secondary:hover {
  border-color: #facc15;
  color: #facc15;
}
```

### Status Indicators
```css
.status-live {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s infinite;
}
```

---

## Animation Standards

### Entrance Animations
```css
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

### Stagger Delays
- Element 1: 0ms
- Element 2: 100ms
- Element 3: 200ms
- Element 4: 300ms

### Infinite Scroll (Photo Strip)
```css
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-scroll {
  animation: scroll 20s linear infinite;
}
.animate-scroll:hover {
  animation-play-state: paused;
}
```

### Hover Transitions
- Default duration: 300ms
- Easing: `ease` or `cubic-bezier(0.16, 1, 0.3, 1)`
- Scale on hover: `scale(1.02)` for cards, `scale(1.05)` for images

---

## Layout Patterns

### Bento Grid
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 280px;
  gap: 1rem;
}

/* Large card spans 2x2 */
.bento-large {
  grid-column: span 2;
  grid-row: span 2;
}

/* Responsive */
@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
}
```

### Photo Gallery (Horizontal Scroll)
- Height: 55vh on desktop, 60vh on mobile
- Item aspect ratio: 2:3 (portrait)
- Gap: 2vw
- Padding: 8vw (horizontal)
- Drag-to-scroll enabled

---

## Iconography

### Icon Style
- Stroke icons preferred (1.5-2px stroke width)
- Size: 20px (default), 24px (prominent), 16px (small)
- Color: Inherits text color

### Social Icons
- Instagram: Primary social
- Use filled icons for social platforms

---

## Imagery Guidelines

### Photo Style
- Action sports focus (volleyball, beach sports)
- High contrast, vivid colors
- Motion blur acceptable for energy
- Player-focused framing

### Photo Treatments
- Grayscale → Color on hover (gallery strip)
- Subtle vignette for hero images
- Grain overlay for texture (optional)

### Aspect Ratios
- Hero: 16:9 or full-width
- Gallery items: 2:3 (portrait)
- Event cards: 3:2 (landscape)
- Thumbnails: 4:3

---

## Responsive Breakpoints

| Name | Min Width | Usage |
|------|-----------|-------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet |
| lg | 1024px | Small desktop |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for body text
- Focus states: Yellow outline (2px solid #facc15)
- Reduced motion: Respect `prefers-reduced-motion`
- Alt text required for all images
- Semantic HTML structure
