/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(athlete)` | `/(athlete)/booking-success` | `/(athlete)/coaches` | `/(athlete)/dashboard` | `/(athlete)/dashboard/bookings` | `/(athlete)/dashboard/messages` | `/(athlete)/dashboard/profile` | `/(auth)` | `/(auth)/check-email` | `/(auth)/forgot-password` | `/(auth)/get-started` | `/(auth)/profile-setup` | `/(auth)/reset-password` | `/(auth)/role-select` | `/(auth)/signin` | `/(auth)/signup` | `/(auth)/verify-email` | `/(coach)` | `/(coach)/dashboard` | `/(coach)/dashboard/availability` | `/(coach)/dashboard/messages` | `/(coach)/dashboard/payments` | `/(coach)/dashboard/profile` | `/_sitemap` | `/booking-success` | `/check-email` | `/coaches` | `/dashboard` | `/dashboard/availability` | `/dashboard/bookings` | `/dashboard/messages` | `/dashboard/payments` | `/dashboard/profile` | `/forgot-password` | `/get-started` | `/onboarding` | `/profile-setup` | `/reset-password` | `/role-select` | `/signin` | `/signup` | `/verify-email`;
      DynamicRoutes: `/(athlete)/coach/${Router.SingleRoutePart<T>}` | `/coach/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/(athlete)/coach/[id]` | `/coach/[id]`;
    }
  }
}
