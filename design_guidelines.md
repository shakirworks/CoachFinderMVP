# Design Guidelines: Premium Athletic Coaching Platform

## Design Approach

**Reference-Based Approach** inspired by premium wellness brands:
- **Lululemon** for sophisticated minimalism and premium athletic aesthetic
- **Apple Fitness+** for refined UI patterns and smooth interactions
- **Headspace** for calming, purposeful whitespace
- **Mobile-First** with desktop enhancement

**Core Principles:**
- Premium minimalism with generous breathing room
- Sophisticated, calming visual language
- Refined interactions with smooth micro-animations
- Photography-led content with elegant typography overlay

## Typography

**Font Stack:** Inter (via Google Fonts)
- **Display (Hero/Headers):** Inter Light/Regular - elegant, spacious
- **Body:** Inter Regular - clean readability
- **Accent (Labels/CTAs):** Inter Medium

**Scale & Spacing:**
- Hero text: text-5xl to text-7xl with tracking-tight, leading-tight
- Section headers: text-3xl to text-4xl with generous letter-spacing
- Body: text-base to text-lg (generous line-height of 1.7)
- Labels: text-sm uppercase with tracking-wide
- Minimum mobile text: 16px

**Hierarchy through weight and spacing, not size extremes**

## Layout System

**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16, 20, 24
- Generous whitespace: py-16, py-20, py-24 for sections
- Component breathing room: p-8, p-12
- Subtle gaps: gap-6, gap-8
- Asymmetric layouts with intentional empty space

**Grid Structure:**
- Mobile: Single column, max-w-sm to max-w-md for forms
- Desktop: max-w-5xl for content, max-w-2xl for reading zones
- Asymmetric two-column for profile pages (40/60 split)

## Component Library

### Landing Page
**Hero Section:**
- Full-bleed lifestyle photography (serene athletic environment - yoga studio, minimal gym, outdoor running path)
- Image: Soft-focused, high-quality lifestyle shot conveying calm athleticism
- Overlay: Gradient vignette for text legibility
- Centered headline in elegant typography with ample line-height
- Subtle CTA button with blur-backdrop (backdrop-blur-sm bg-white/10)
- Height: 85vh to allow scroll reveal

**Role Selection:**
- Below hero, two large cards in horizontal layout (desktop) / stacked (mobile)
- Each card: Minimal border, subtle hover lift (translateY -2px, duration 300ms)
- Clean icon illustrations (Heroicons), centered
- Card padding: p-12
- Hover: Gentle shadow elevation

### Authentication Flow
- Centered container max-w-md with generous padding
- Minimal form design: borderless inputs with bottom border only
- Input height: h-14, focus transition smooth
- Single-column layout with vertical rhythm
- "Continue" CTA: Full-width, rounded-full, elegant hover scale (1.01)

### Profile Setup
**Multi-step with visual breathing room:**

**Photo Upload:**
- Large circular preview: 200px desktop, 160px mobile
- Subtle dashed border when empty
- Upload zone with soft shadow on hover
- Camera icon (Heroicons) centered

**Form Sections:**
- One section visible at a time with smooth fade transitions
- Input fields: Clean, minimal with subtle focus rings
- Sports selection: Refined pill chips in flex-wrap grid
  - Rounded-full, border-2, px-6 py-3
  - Smooth selection animation (scale 0.98 on press)
  - Sports grid: 4 columns desktop, 2 mobile, gap-4

**Progress Indicator:**
- Minimal dots at top center
- Active state: smooth width expansion
- Transition: all 400ms ease-in-out

### Navigation
- Minimal header: 60px height, subtle bottom border
- Logo/wordmark left-aligned
- Profile avatar right-aligned on authenticated pages
- Sticky with backdrop-blur on scroll

### Forms & Inputs
**Input Fields:**
- Height: h-14
- Border: Bottom border only (border-b-2)
- Focus: Smooth border color transition (300ms)
- Label: Floating animation on focus
- Rounded: rounded-none (sharp, clean edges)

**Buttons:**
- Primary CTA: rounded-full, px-8 py-4
- Secondary: Border-only with smooth fill transition
- Hover: Gentle scale (1.02) with 200ms ease
- Focus: Subtle ring, no harsh outlines

**Sport Tags:**
- Pill shape: rounded-full
- Size: px-6 py-2.5
- Selection: Smooth background fill (300ms)
- Icon + label, gap-2

## Images

**Hero Sections:**
- Full-bleed lifestyle photography required
- Suggested scenes: Minimal athletic environments, soft natural lighting, calm energy
- Treatment: Subtle vignette overlay, slightly desaturated for sophistication
- Mobile: Maintain aspect ratio with object-cover

**Profile Avatars:**
- Circular crop, high-quality
- Placeholder: Soft gradient background

**Approach:** Photography-led design with atmospheric lifestyle imagery establishing premium feel

## Animations & Interactions

**Transition Philosophy:** Smooth, refined, purposeful
- Page transitions: Fade + subtle slide (20px, 400ms ease-out)
- Card hovers: translateY -2px, shadow elevation (200ms)
- Button interactions: Scale 1.02 (200ms ease-in-out)
- Input focus: Border color + subtle glow (300ms)
- Multi-step forms: CrossFade between steps (500ms)
- Scroll: Subtle parallax on hero (0.5 speed)

**Timing:** All animations 200-500ms, ease-in-out or cubic-bezier for elegance

## Mobile Optimization
- Touch targets: 48px minimum
- Generous tap zones with p-4 around clickable elements
- Bottom-sheet patterns for mobile selections
- Smooth swipe gestures for multi-step forms
- Safe area padding for notched devices

## Accessibility
- WCAG AA contrast minimum
- Smooth focus indicators (never remove outlines)
- Semantic HTML with ARIA labels
- Keyboard navigation with visible focus states
- Motion: respect prefers-reduced-motion