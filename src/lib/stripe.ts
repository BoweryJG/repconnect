import { SUBSCRIPTION_TIERS } from './subscriptionTiers';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

export async function createCheckoutSession(
  tier: keyof typeof SUBSCRIPTION_TIERS,
  billingCycle: 'monthly' | 'annual',
  userId: string
): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tier,
        billingCycle,
        userId,
        successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionUrl } = await response.json();
    return sessionUrl;
  } catch (_error) {
    return null;
  }
}

export async function createCustomerPortalSession(customerId: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/api/stripe/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: window.location.origin,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const { url } = await response.json();
    return url;
  } catch (_error) {
    return null;
  }
}

export async function handleStripeWebhook(event: any): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      // Handle successful subscription
      await handleCheckoutComplete(event.data.object);
      break;

    case 'customer.subscription.updated':
      // Handle subscription updates
      await handleSubscriptionUpdate(event.data.object);
      break;

    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      await handleSubscriptionCancellation(event.data.object);
      break;

    default:
  }
}

async function handleCheckoutComplete(_session: any) {
  // Update user's subscription in database
  // Implementation would update Supabase
}

async function handleSubscriptionUpdate(_subscription: any) {
  // Update subscription status in database
  // Implementation would update Supabase
}

async function handleSubscriptionCancellation(_subscription: any) {
  // Handle subscription cancellation
  // Implementation would update Supabase
}
