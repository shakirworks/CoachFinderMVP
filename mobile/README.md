# CoachFinders Mobile App

A React Native (Expo) iOS app that mirrors all features of the CoachFinders web platform.

## Tech Stack

- **Expo SDK 51** with Expo Router (file-based routing)
- **React Native** 0.74
- **TypeScript**
- **TanStack Query v5** for data fetching
- **Expo SecureStore** for persistent auth sessions
- **Expo Haptics** for tactile feedback
- **Expo ImagePicker** for profile photos
- **Expo WebBrowser** for Stripe checkout

## Project Structure

```
mobile/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout (providers)
│   ├── index.tsx               # Landing / role selection
│   ├── (auth)/                 # Auth flow screens
│   │   ├── role-select.tsx     # Choose athlete or coach
│   │   ├── signup.tsx          # Email + password registration
│   │   ├── check-email.tsx     # Verification email sent
│   │   ├── verify-email.tsx    # Deep link email verification
│   │   ├── profile-setup.tsx   # Complete profile after verification
│   │   ├── signin.tsx          # Login + 2FA code entry
│   │   └── forgot-password.tsx # Password reset
│   ├── (athlete)/              # Athlete screens
│   │   ├── coaches.tsx         # Coach discovery with search/filters
│   │   ├── coach/[id].tsx      # Coach profile, booking, inline chat
│   │   ├── booking-success.tsx # Post-booking confirmation
│   │   └── dashboard/          # Tab navigation
│   │       ├── profile.tsx     # Athlete profile management
│   │       ├── bookings.tsx    # Invoice history
│   │       └── messages.tsx    # Message threads with coaches
│   └── (coach)/                # Coach screens
│       └── dashboard/          # Tab navigation
│           ├── availability.tsx # Calendar + slot management
│           ├── messages.tsx     # Message threads with athletes
│           ├── payments.tsx     # Stripe Connect management
│           └── profile.tsx     # Coach profile management
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── CoachCard.tsx
│   │   ├── Input.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── MessageBubble.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth state + SecureStore persistence
│   ├── lib/
│   │   ├── api.ts              # API client with cookie management
│   │   └── types.ts            # TypeScript interfaces
│   └── theme/
│       └── colors.ts           # CoachFinders color palette
├── app.json                    # Expo config
├── babel.config.js
├── metro.config.js
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- Xcode (for iOS simulator) or the Expo Go app on your iPhone

### Install Dependencies

```bash
cd mobile
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and set:
```
EXPO_PUBLIC_API_URL=https://coachfinders.replit.app
```

For local development, use your machine's IP address:
```
EXPO_PUBLIC_API_URL=http://192.168.1.xxx:5000
```

### Run the App

```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android
npm run android
```

### Scan QR Code (Physical Device)

1. Install **Expo Go** from the App Store
2. Run `npm start`
3. Scan the QR code with your camera (iOS) or Expo Go (Android)

## Features

### Athletes
- Browse and filter coaches by sport, level, coaching type, and hourly rate
- View full coach profiles with bio, certifications, and experience
- Select available time slots via calendar view
- Book sessions via Stripe Checkout (opens in-app browser)
- In-app chat with coaches
- View booking history and invoices
- Manage profile (photo, sport, skill level, location)

### Coaches
- Manage availability with a full calendar + time slot picker
- Respond to athlete messages
- Connect Stripe account to receive payments
- View and update coaching profile (rates, bio, certifications)
- Account management (delete account, sign out)

## Deep Links

The app handles the `coachfinders://` URL scheme for:
- Email verification: `coachfinders://(auth)/verify-email?token=xxx`

## API Integration

All requests go to the backend at `EXPO_PUBLIC_API_URL`. Session cookies are manually persisted via AsyncStorage since React Native's `fetch` does not persist cookies automatically. Sensitive user data (logged-in user, role) is stored in Expo SecureStore.

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios
```
