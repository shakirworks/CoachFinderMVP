# Design Guidelines: Athlete-Coach Platform

## Design Approach

**Reference-Based Approach** drawing from athletic and social platforms:
- **Strava** for sports-focused visual language and energy
- **LinkedIn** for professional profile onboarding flow
- **Instagram** for image-first profile presentation
- **Mobile-First** optimization given cross-platform requirement

**Core Principles:**
- Bold, energetic design that motivates athletic achievement
- Clear role differentiation (athlete vs coach)
- Streamlined onboarding with visual feedback
- Mobile-optimized touch targets and responsive layouts

## Typography

**Font Stack:**
- **Primary (Headings):** Inter Bold/ExtraBold - clean, modern, athletic
- **Secondary (Body):** Inter Regular/Medium - excellent readability across devices
- **Accent (Stats/Labels):** Inter SemiBold

**Scale:**
- Hero/Role Cards: text-4xl to text-5xl (mobile), text-6xl (desktop)
- Page Titles: text-3xl
- Section Headers: text-xl to text-2xl
- Body Text: text-base (16px minimum for mobile)
- Labels/Captions: text-sm

## Layout System

**Spacing Primitives:** Tailwind units of 3, 4, 6, 8, 12, 16
- Tight spacing: p-3, gap-3
- Standard spacing: p-6, gap-4, m-8
- Generous section spacing: py-12, py-16

**Grid Structure:**
- Mobile: Single column, full-width cards
- Desktop: max-w-md for forms, max-w-4xl for profile pages
- Role selection: 2-column grid on mobile/tablet, centered cards

## Component Library

### Landing Page - Role Selection
- **Full-screen layout** with centered content
- **Two large interactive cards** for Athlete/Coach selection
- Each card: 
  - Large illustrative icon (dumbbells for athlete, whistle for coach)
  - Role title in bold typography
  - Brief description underneath
  - Subtle hover lift effect (translateY)
  - Minimum touch target: 120px height on mobile

### Authentication Flow
- **Clean, centered form** (max-w-md)
- Email input with large touch-friendly field
- Prominent CTA button spanning full width on mobile
- Role indicator badge at top showing selected role

### Profile Setup Page
- **Progressive disclosure** - one section at a time focus
- **Image Upload Area:**
  - Circular avatar preview (120px mobile, 160px desktop)
  - Dashed border when empty with camera icon
  - "Upload Photo" text below
  
- **Form Sections:**
  - Name input: Single text field, prominent
  - Location: Input with map pin icon
  - Sports Selection: Multi-select chip interface
    - Grid of sport badges (3 columns mobile, 4-5 desktop)
    - Active state: filled background
    - Common sports: Running, Cycling, Swimming, Basketball, Soccer, Tennis, Yoga, CrossFit, Weightlifting
    - Tappable chips with checkmark when selected

- **Progress Indicator:** Step dots at top (1. Role → 2. Email → 3. Profile)
- **Bottom Action Bar:** Sticky CTA "Complete Profile" button

### Navigation & Chrome
- **Minimal header** during onboarding (back button + progress only)
- **Bottom-aligned actions** on mobile for thumb accessibility
- **Safe area insets** for mobile devices

### Forms & Inputs
- **Input Fields:**
  - Height: h-12 minimum for mobile touch
  - Rounded corners: rounded-lg
  - Border: 2px solid with focus ring
  - Clear error states with inline validation
  
- **Buttons:**
  - Primary: Full-width on mobile, auto-width on desktop
  - Height: py-3 to py-4
  - Rounded: rounded-lg to rounded-xl
  - Clear disabled state (opacity-50)

### Sports Interest Tags
- **Chip Design:**
  - Rounded-full pill shape
  - px-4 py-2 sizing
  - Interactive states: border on inactive, filled on active
  - Icon + label combination
  - Grid layout with gap-3

## Images

**Profile Setup:**
- Placeholder avatar with gradient background when empty
- Support for uploaded images: JPG/PNG, circular crop preview
- Image optimization for mobile upload

**Role Selection Cards:**
- Icon-based illustrations (use Heroicons for consistency)
- No photographic images needed - keep clean and icon-focused

**Overall Approach:** Icon and illustration-driven rather than photographic to maintain flexibility and fast load times on mobile.

## Mobile Optimization

- **Touch Targets:** Minimum 44px height for all interactive elements
- **Thumb Zone:** Primary actions in bottom third of screen
- **Viewport Units:** Avoid fixed 100vh, use min-h-screen for flexibility
- **Responsive Spacing:** py-6 mobile, py-12 desktop
- **Input Focus:** Prevent zoom on iOS with 16px minimum font size

## Accessibility
- High contrast text (WCAG AA minimum)
- Focus indicators on all interactive elements
- ARIA labels for icon-only buttons
- Semantic HTML throughout
- Clear validation messaging

## Animation
**Minimal, purposeful motion only:**
- Page transitions: Simple fade
- Card selection: Subtle scale (1.02) on press
- Form validation: Shake on error
- Avoid scroll-triggered animations