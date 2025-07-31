import { RepXTier } from '../types';

// Map Stripe price IDs to RepX tiers
const STRIPE_PRICE_TO_TIER: Record<string, RepXTier> = {
  // Live price IDs from Stripe
  price_1QgWQVC9v5W0P6U7B1pIAiIt: RepXTier.Rep1, // RepX¹ Explorer - $97/month
  price_1QgWRmC9v5W0P6U740tP5l77: RepXTier.Rep2, // RepX² Professional - $197/month
  price_1QgWSbC9v5W0P6U7zRwlpJFn: RepXTier.Rep3, // RepX³ Business - $297/month
  price_1QgWTGC9v5W0P6U7kfrLRGYL: RepXTier.Rep4, // RepX⁴ Enterprise - $497/month
  price_1QgWTyC9v5W0P6U7RWEV5hIA: RepXTier.Rep5, // RepX⁵ Elite - $997/month
};

export function getTierFromStripePrice(priceId: string): RepXTier {
  return STRIPE_PRICE_TO_TIER[priceId] || RepXTier.Rep0;
}
