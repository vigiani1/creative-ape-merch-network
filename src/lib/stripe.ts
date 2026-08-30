import "server-only";
import Stripe from "stripe";
import { requireServerEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(requireServerEnv("STRIPE_SECRET_KEY"), { typescript: true });
  }
  return stripeClient;
}
