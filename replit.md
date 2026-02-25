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
    - **Athletes**: `id`, `name`, `sport`, `location`, `email`, `password`, `emailVerified`, `profileImage`, `availableForCoachRequests`, `gender`, `age`, `skillLevel`, `preferredCoachGender`.
    - **Coaches**: `id`, `name`, `sport`, `location`, `email`, `password`, `emailVerified`, `profileImage`, `hourly_rate`, `coaching_options` (array), `years_of_experience`, `student_levels` (array), `stripeAccountId`, `stripeAccountStatus`, `stripeOnboardingComplete`.
    - **Verification Codes**: `id`, `email`, `code`, `role`, `type` (login/signup), `hashedPassword`, `expiresAt`, `used`.
    - **Messages**: `id`, `athleteId`, `coachId`, `message`, `senderType`, `createdAt`.
    - **Purchases**: `id`, `athleteId`, `coachId`, `subtotal`, `serviceFee`, `totalAmount`, `status`, `selectedSlots`.
    - **Invoices**: `id`, `purchaseId`, `invoiceNumber`, `issuedAt`, `paidAt`, `providerReceiptUrl`.
- **Migration Strategy**: Drizzle ORM for schema management and migrations.

### Authentication and Authorization
- **Signup Flow**: Email + password entry → verification email sent with link (24hr expiry) → user clicks link → email verified page → profile setup → account created with hashed password from verification record.
- **Sign-in Flow**: Email + password verification → 5-digit code sent to email (10min expiry) → code verified → user logged in.
- **Password Security**: bcrypt hashing (10 rounds), passwords never returned in API responses.
- **Email Verification**: Verification tokens (UUID) stored in `verification_codes` table with type="signup", role, and hashed password. Token marked as used after account creation.
- **Email Service**: Nodemailer with SMTP (support@coachfinders.ca), sends welcome verification emails and login codes.
- **Session Management**: Server-side sessions via `express-session` with `connect-pg-simple` (PostgreSQL store). 30-minute rolling timeout with inactivity warning dialog at 28 minutes. Sessions created on login verification and signup. AuthProvider context (`client/src/contexts/AuthContext.tsx`) manages auth state app-wide, syncing with server sessions and localStorage fallback. Profile pages consume AuthContext as primary source.

## External Dependencies

- **Payment Gateway**: Stripe Connect Express with embedded onboarding (coaches complete setup without leaving the platform). Uses `@stripe/connect-js` and `@stripe/react-connect-js` for embedded `ConnectAccountOnboarding` component. Backend creates Express accounts via V2-first/V1-fallback (`/api/coaches/:id/stripe/connect`), then generates Account Sessions (`/api/coaches/:id/stripe/account-session`) for embedded components. Account status checks try V2 first with V1 fallback. Checkout Sessions use V1 API with destination charges model. Platform fee: 7% service fee + 13% HST (Ontario) on (subtotal + service fee). Coach receives subtotal directly; platform collects application_fee_amount = serviceFee + taxAmount. All amounts in CAD. Stripe credentials stored as STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY secrets. Webhooks: V1 endpoint at `/api/stripe/webhook` (checkout events, account.updated), V2 thin events at `/api/stripe/webhook/v2` (v2.core.account.* events).
- **UI Libraries**: Radix UI, shadcn/ui, Lucide React (icons).
- **Database & ORM**: Drizzle ORM, `@neondatabase/serverless` (PostgreSQL driver).
- **Utilities**: `date-fns`, `zod`, `class-variance-authority`, `clsx`, `tailwind-merge`.
- **Development Tools**: `@replit/vite-plugin-*`, TypeScript, ESBuild, PostCSS, Autoprefixer.
- **Fonts**: Google Fonts (Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter).