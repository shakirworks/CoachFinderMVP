# CoachFinders - Premium Athletic Coaching Platform

## Overview
CoachFinders is a web platform connecting athletes with coaches across various sports. It features a premium, minimalist design inspired by Lululemon and Apple Fitness+, focusing on fostering meaningful connections. The application supports user onboarding, profile management, coach discovery with filtering, real-time messaging, and secure payment processing via Stripe. The business vision is to create a leading marketplace for athletic coaching, offering a seamless experience for both athletes and coaches.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript, Vite, Wouter for routing, TanStack Query for data fetching, Framer Motion for animations.
- **UI Framework**: shadcn/ui built on Radix UI, Tailwind CSS for styling with a custom Lululemon-inspired color palette (burgundy primary, soft grays, clean whites).
- **Design System**: Mobile-first, responsive, premium minimalist aesthetic with Inter font.
- **State Management**: Local storage for user sessions, TanStack Query for server state, React hooks for component state.
- **Key Architectural Decisions**: Component-based architecture, page-level components, custom domain-specific components, path aliases for clean imports.

### Backend Architecture
- **Technology Stack**: Express.js with TypeScript.
- **API Design**: RESTful API endpoints under `/api` for CRUD operations, message management, and payment processing. JSON request/response format with Zod validation.
- **Storage Layer**: Interface-based storage abstraction, currently implemented with PostgreSQL via Drizzle ORM.
- **Development Features**: Request logging middleware, Vite integration for HMR.

### Data Storage Solutions
- **Database**: PostgreSQL (via Drizzle ORM and Neon serverless driver).
- **Schema**:
    - **Athletes**: `id`, `name`, `sport`, `location`, `email`, `profileImage`.
    - **Coaches**: `id`, `name`, `sport`, `location`, `email`, `profileImage`, `hourly_rate`, `coaching_options` (array), `years_of_experience`, `student_levels` (array), `stripeAccountId`, `stripeAccountStatus`, `stripeOnboardingComplete`.
    - **Messages**: `id`, `athleteId`, `coachId`, `message`, `senderType`, `createdAt`.
    - **Purchases**: `id`, `athleteId`, `coachId`, `subtotal`, `serviceFee`, `totalAmount`, `status`, `selectedSlots`.
    - **Invoices**: `id`, `purchaseId`, `invoiceNumber`, `issuedAt`, `paidAt`, `providerReceiptUrl`.
- **Migration Strategy**: Drizzle ORM for schema management and migrations.

### Authentication and Authorization
- **Current State**: Email-based profile creation without password verification; user identification via localStorage for MVP.
- **Design Intent**: Ready for future session-based or OAuth authentication.

## External Dependencies

- **Payment Gateway**: Stripe (Stripe Checkout for athletes, Stripe Connect for coaches, webhooks for event handling).
- **UI Libraries**: Radix UI, shadcn/ui, Lucide React (icons).
- **Database & ORM**: Drizzle ORM, `@neondatabase/serverless` (PostgreSQL driver).
- **Utilities**: `date-fns`, `zod`, `class-variance-authority`, `clsx`, `tailwind-merge`.
- **Development Tools**: `@replit/vite-plugin-*`, TypeScript, ESBuild, PostCSS, Autoprefixer.
- **Fonts**: Google Fonts (Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter).