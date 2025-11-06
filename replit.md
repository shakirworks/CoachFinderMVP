# CoachConnect - Premium Athletic Coaching Platform

## Overview

CoachConnect is a web application that connects athletes with coaches across various sports. The platform features a premium, minimalist design inspired by Lululemon and Apple Fitness+, with a focus on creating meaningful connections between athletes seeking coaching and experienced coaches offering their expertise.

The application supports user onboarding (athletes and coaches), profile management, coach discovery with filtering, and real-time messaging capabilities. Athletes can browse coaches by sport and location, view detailed profiles, and initiate conversations directly through the platform.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and data fetching
- Framer Motion for page transitions and animations

**UI Framework:**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- "New York" style variant from shadcn/ui
- Custom color palette based on Lululemon aesthetic (burgundy primary, soft grays, clean whites)

**Design System:**
- Mobile-first responsive design
- Premium minimalist aesthetic with generous whitespace
- Inter font family via Google Fonts
- Custom CSS variables for theming (light mode focused)
- Hover and active state micro-interactions using utility classes

**State Management:**
- Local storage for persisting current user session (athlete/coach data)
- TanStack Query for server-side state caching and synchronization
- React hooks for component-level state
- No global state management library (Redux, Zustand, etc.)

**Key Architectural Decisions:**
- Component-based architecture with reusable UI components in `/client/src/components/ui`
- Page-level components in `/client/src/pages`
- Custom components for domain-specific features (CoachCard, ChatWindow, ProfileSetupForm)
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)

### Backend Architecture

**Technology Stack:**
- Express.js for HTTP server and API routing
- TypeScript for type safety across the stack
- In-memory storage implementation (MemStorage class) with interface for future database migration

**API Design:**
- RESTful API endpoints under `/api` prefix
- CRUD operations for athletes and coaches
- Message thread management for coach-athlete communication
- JSON request/response format
- Error handling with appropriate HTTP status codes

**Storage Layer:**
- Interface-based storage abstraction (IStorage) allowing swappable implementations
- Current implementation: In-memory storage with dummy data initialization
- Prepared for migration to database-backed storage
- Pre-populated with sample Ontario-based coaches across Soccer, Tennis, and Golf

**Development Features:**
- Request logging middleware with timing and response capture
- Vite integration for HMR in development
- Static file serving for production builds

### Data Storage Solutions

**Current Implementation:**
- In-memory storage using JavaScript Maps and Arrays
- No persistence across server restarts
- Dummy data initialization for development/demo purposes

**Database Schema (Prepared for PostgreSQL via Drizzle ORM):**

**Athletes Table:**
- id (UUID primary key)
- name (text)
- sport (text)
- location (text)
- email (unique text)
- profileImage (optional text)

**Coaches Table:**
- id (UUID primary key)
- name (text)
- sport (text)
- location (text)
- email (unique text)
- profileImage (optional text)

**Messages Table:**
- id (UUID primary key)
- athleteId (foreign key to athletes)
- coachId (foreign key to coaches)
- message (text)
- senderType (enum: "athlete" or "coach")
- createdAt (timestamp)

**Migration Strategy:**
- Drizzle ORM configured for PostgreSQL with Neon serverless driver
- Schema definitions in `/shared/schema.ts` using Drizzle schema builder
- Zod schemas derived from Drizzle for runtime validation
- Ready for database provisioning (requires DATABASE_URL environment variable)

### Authentication and Authorization

**Current State:**
- No authentication system implemented
- Email-based profile creation without password verification
- User identification via localStorage (client-side only)
- No session management or JWT tokens

**Design Intent:**
- Email collection as first step in user flow
- Profile setup follows email submission
- Users stored in localStorage for demo/MVP purposes
- Ready for future auth integration (likely session-based or OAuth)

### External Dependencies

**Third-Party UI Libraries:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui for pre-built styled components
- Lucide React for icon system
- cmdk for command palette functionality (installed but not actively used)

**Database & ORM:**
- Drizzle ORM for type-safe database queries
- @neondatabase/serverless for PostgreSQL connection (configured but not active)
- drizzle-kit for schema migrations
- connect-pg-simple for session storage (installed, not currently used)

**Utilities:**
- date-fns for date formatting in message threads
- zod for runtime schema validation
- class-variance-authority and clsx for conditional class management
- tailwind-merge for Tailwind class deduplication

**Development Tools:**
- @replit/vite-plugin-* for Replit-specific development enhancements
- TypeScript for static type checking
- ESBuild for production bundling
- PostCSS with Autoprefixer for CSS processing

**Asset Management:**
- Stock images stored in `/attached_assets/stock_images/`
- Vite alias (`@assets`) for asset imports
- Image references: athlete and coach placeholder images

**Fonts:**
- Google Fonts integration in HTML head
- Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter (multiple families loaded)
- Primary usage: Inter for UI, as per design guidelines