import Stripe from 'stripe';

export const STRIPE_V2_API_VERSION = '2025-12-15.preview';

function getCredentials() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  if (!secretKey || !publishableKey) {
    throw new Error(
      'STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY environment variables are required. ' +
      'Set them in your Replit Secrets.'
    );
  }

  return { secretKey, publishableKey };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = getCredentials();
  return new Stripe(secretKey);
}

export function getV2Headers(): { additionalHeaders: { 'Stripe-Version': string } } {
  return {
    additionalHeaders: {
      'Stripe-Version': STRIPE_V2_API_VERSION,
    },
  };
}

export async function getStripePublishableKey() {
  const { publishableKey } = getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = getCredentials();
  return secretKey;
}
