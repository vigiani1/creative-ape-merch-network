const FALLBACK_SUPABASE_URL = "https://nqlwauyerrxcddjmdpcx.supabase.co";

export function getPublicSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
}

export function hasSupabaseEnv() {
  return Boolean(getPublicSupabaseUrl());
}

export function requireServerEnv(name: "SUPABASE_SERVICE_ROLE_KEY" | "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}
