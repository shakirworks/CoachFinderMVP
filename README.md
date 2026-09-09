# CoachFinders

CoachFinders is a two-sided marketplace that helps athletes discover, message, book, and pay qualified sports coaches. Coaches can present their experience, manage availability, communicate with athletes, and receive payouts through Stripe Connect.

The repository includes a responsive web application, an Express API, a PostgreSQL data layer, and an Expo mobile application for iOS and Android. It is also a practical case study in **agentic software development**: product features and production fixes were delivered through human-directed collaboration with Replit Agent.

## Why This Project Matters

CoachFinders demonstrates how an AI coding agent can support more than initial prototyping. Agent-assisted work in this repository spans product implementation, cross-platform adaptation, integrations, debugging, dependency remediation, and build configuration.

For clients evaluating agentic programming, the project shows a useful operating model:

1. A person defines the product goal, constraints, and acceptance criteria.
2. The agent inspects the existing system before changing it.
3. The agent implements a focused change across the required layers.
4. The agent runs relevant checks and investigates failures using logs and reproducible commands.
5. The person reviews the result and provides product or operational feedback.
6. The agent iterates while preserving the repository's established architecture.

This approach keeps product ownership with the human while using agents to reduce the time required for implementation, investigation, and repetitive engineering work.

## Product Features

### Athlete Experience

- Browse and filter coaches by sport, skill level, coaching type, location, and rate
- View coach profiles, experience, certifications, services, and availability
- Select available time slots and book coaching sessions
- Pay securely through Stripe Checkout
- Message coaches within the platform
- Review booking history, invoices, and receipts
- Manage athlete profile details and profile photos

### Coach Experience

- Create and maintain a professional coaching profile
- Configure rates, sports, experience, certifications, and coaching options
- Manage availability through calendar and time-slot controls
- Communicate directly with athletes
- Complete embedded Stripe Connect onboarding
- Receive booking payouts through connected Stripe accounts
- Manage account and profile settings

### Accounts and Platform Operations

- Athlete and coach registration flows
- Email verification links
- Password reset by email
- Two-step sign-in using emailed verification codes
- Secure server-side sessions
- Password hashing with bcrypt
- Profile image uploads
- In-app notifications and message updates
- Stripe webhook processing for checkout and connected-account events
- Structured purchases, invoices, and payment history

## Web and Mobile

### Responsive Web Application

The web experience uses React and TypeScript with a mobile-first interface. It includes onboarding, coach discovery, profiles, availability, booking, payments, messaging, and account management.

### Expo Mobile Application

The `mobile/` application mirrors the core marketplace experience on iOS and Android. It uses Expo Router, secure local session storage, native image selection, haptic feedback, deep links, and in-app browser handoff for Stripe Checkout.

See [mobile/README.md](mobile/README.md) for the mobile project structure and platform-specific commands.

## Features Developed and Improved with Replit Agent

Replit Agent was used as an engineering collaborator under human direction. The agent-assisted work represented in the repository includes:

- Extending the web marketplace across athlete and coach workflows
- Building an Expo/React Native companion application
- Implementing and refining authentication, verification, and password recovery
- Supporting mobile email-verification deep links
- Creating coach discovery, profiles, booking, calendar, and messaging experiences
- Integrating Stripe Checkout and Stripe Connect onboarding and payouts
- Improving mobile startup behavior, branding assets, icons, and splash handling
- Diagnosing Expo and EAS Android build failures
- Correcting package and build-tool compatibility issues
- Hardening root and mobile dependency trees, including remediation of identified dependency vulnerabilities
- Running type, build, configuration, and runtime checks after changes

Agentic development here does not mean accepting generated code without review. The workflow relies on repository inspection, explicit constraints, narrow changes, observable validation, and human approval.

## Agentic Break/Fix Process

The mobile Android build provides a representative example of the debugging process used during development.

### 1. Collect evidence

The investigation started with build metadata, available logs, package versions, EAS configuration, lockfiles, and the state of generated native directories. When remote build information was unavailable without Expo authentication, the investigation continued locally rather than relying on guesses.

### 2. Reproduce the failing stage

The relevant Expo prebuild command was run in the project environment. This exposed a concrete failure while creating the Android native project instead of treating the final EAS error as the root cause.

### 3. Isolate package compatibility

The agent traced the failure into Expo CLI's archive extraction path and inspected the installed `tar` module shape. That narrowed the problem to incompatible module interop introduced by a package override. The dependency constraint was corrected to a compatible major version.

### 4. Validate native generation

Expo prebuild was rerun to confirm that Android project generation completed. Generated Gradle settings were then reviewed for likely resource pressure and signing behavior.

### 5. Adjust the build profile

The preview build was configured to:

- Produce an installable APK
- Build the `arm64-v8a` architecture for internal testing
- Allocate additional Gradle memory
- Use the current EAS `applicationArchivePath` field
- Match the artifact path to the selected Gradle task

### 6. Clean and verify

Generated native directories remained excluded from source control so EAS could use a clean Continuous Native Generation workflow. Lockfile URLs and dependency versions were checked, configuration was re-read, and the build instructions were updated based on each observed error.

### What this demonstrates

The agentic value was not a single generated patch. It was the ability to move through an evidence-based loop:

**observe → reproduce → isolate → change → verify → document**

That loop is applicable to feature regressions, integration failures, dependency conflicts, CI problems, and platform-specific build errors.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Web client | React 18, TypeScript, Vite, Wouter, TanStack Query, Framer Motion |
| Design system | Tailwind CSS, shadcn/ui, Radix UI, Lucide |
| API | Express, TypeScript, REST, Zod |
| Data | PostgreSQL, Drizzle ORM, Neon serverless driver |
| Authentication | Express sessions, PostgreSQL session store, bcrypt, email verification |
| Payments | Stripe Checkout, Stripe Connect Express, Stripe webhooks |
| Email | Nodemailer with SMTP |
| Mobile | Expo SDK 51, React Native 0.74, Expo Router, SecureStore |
| Tooling | TypeScript, ESBuild, EAS Build, Replit workflows and Agent |

## Architecture

```text
.
├── client/              # React web application
├── server/              # Express API, email, payments, and webhooks
├── shared/              # Shared database schema and validation
├── mobile/              # Expo iOS, Android, and web application
├── attached_assets/     # Project assets and imported diagnostics
├── drizzle.config.ts    # Database tooling configuration
├── vite.config.ts       # Web build and development configuration
└── package.json         # Root scripts and dependencies
```

The Express server exposes JSON endpoints under `/api`. Both clients use the same backend domain model for athletes, coaches, messages, availability, purchases, invoices, verification records, and notifications.

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL database
- SMTP account for transactional email
- Stripe account for payment features

### Install

```bash
git clone <your-repository-url>
cd <repository-directory>
npm install
```

### Environment Variables

Configure environment variables through your hosting platform or a local environment file. Never commit credentials.

```text
DATABASE_URL
SESSION_SECRET
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

Depending on the Stripe webhook configuration, the server can also use:

```text
STRIPE_WEBHOOK_SECRET_V2
```

For the Expo application, copy the example configuration:

```bash
cd mobile
cp .env.example .env
```

Then set:

```text
EXPO_PUBLIC_API_URL
```

Use a URL reachable from the device when testing on physical hardware. Do not use `localhost` from a phone.

### Database Schema

After setting `DATABASE_URL`, apply the Drizzle schema:

```bash
npm run db:push
```

### Run the Web Application

```bash
npm run dev
```

The development server hosts the API and Vite-powered web client together.

### Run the Mobile Application

```bash
cd mobile
npm install
npm start
```

Additional mobile commands:

```bash
npm run ios
npm run android
npm run web
```

To test on a physical device, open the generated QR code with Expo Go. A tunnel may be required when the development environment is not directly reachable:

```bash
npx expo start --tunnel
```

## Developer Commands

```bash
# Development server
npm run dev

# TypeScript check
npm run check

# Production build
npm run build

# Run the production bundle
npm start

# Apply the database schema
npm run db:push
```

## Security Notes

- Passwords are hashed and are not returned by API responses.
- Signup, sign-in, and password reset records expire and cannot be reused.
- Password-reset responses are designed to reduce email enumeration.
- Sessions are stored server-side with HTTP-only cookies and secure production settings.
- Stripe webhook signatures are verified before events are processed.
- Request bodies are validated with Zod.
- Dependency overrides are maintained to address known compatibility and security issues.

Before a production launch, run a current dependency audit and application security review. This repository currently uses TypeScript checking and production builds as its primary automated verification; a broader automated test suite is an appropriate next investment.

## Working with an Agentic Programming Partner

For clients, teams, and developers considering an agentic framework, CoachFinders suggests several practical guidelines:

- **Provide outcomes, not only code instructions.** Include the user problem and expected behavior.
- **Keep changes reviewable.** Smaller, focused edits are easier to validate and reverse.
- **Require evidence.** Logs, stack traces, type checks, builds, and screenshots are stronger than assumptions.
- **Let the agent inspect first.** Existing conventions and integrations should guide implementation.
- **Keep humans responsible for product and risk.** Payments, privacy, data migrations, and release decisions require explicit oversight.
- **Document resolved constraints.** Build quirks and integration requirements should be recoverable by the next contributor.
- **Treat agents as part of the engineering system.** Pair them with source control, environment isolation, validation, and deployment controls.

## Current Validation Approach

Before submitting a change, contributors should run:

```bash
npm run check
npm run build
```

For mobile changes, also start the Expo application and validate the affected route on the intended platform. Native release changes should be confirmed with the relevant EAS build profile.

## Contributing

1. Create a focused branch.
2. Describe the user-facing goal and relevant constraints.
3. Keep secrets out of commits and issue discussions.
4. Run the applicable checks.
5. Include reproduction and verification steps in the pull request.
6. Call out agent-generated or agent-modified code that needs additional review.

## License

This project is licensed under the MIT License as declared in `package.json`.
