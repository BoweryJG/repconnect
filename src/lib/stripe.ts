import { SUBSCRIPTION_TIERS } from './subscriptionTiers';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return null;
  }
}

export async function createCustomerPortalSession(
  customerId: string
): Promise<string | null> {
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
  } catch (error) {
    console.error('Error creating portal session:', error);
    return null;
  }
}

export async function handleStripeWebhook(
  event: any
): Promise<void> {
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
      console.log(`Unhandled event type ${event.type}`);
  }
}

async function handleCheckoutComplete(session: any) {
  // Update user's subscription in database
  console.log('Checkout completed:', session);
  // Implementation would update Supabase
}

async function handleSubscriptionUpdate(subscription: any) {
  // Update subscription status in database
  console.log('Subscription updated:', subscription);
  // Implementation would update Supabase
}

async function handleSubscriptionCancellation(subscription: any) {
  // Handle subscription cancellation
  console.log('Subscription cancelled:', subscription);
  // Implementation would update Supabase
}