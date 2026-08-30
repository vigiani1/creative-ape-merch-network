import "server-only";
import Stripe from "stripe";
import { requireServerEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    const secretKey = requireServerEnv("STRIPE_SECRET_KEY");
    if (!secretKey.startsWith("sk_test_")) {
      throw new Error("Stripe Checkout is restricted to test-mode secret keys until commerce is production-ready.");
    }
    stripeClient = new Stripe(secretKey, { typescript: true });
  }
  return stripeClient;
}
