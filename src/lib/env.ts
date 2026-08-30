const FALLBACK_SUPABASE_URL = "https://nqlwauyerrxcddjmdpcx.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_H8Hu-L9mYM6y9nOCYvKP7g_sa5Ys2K3";

export function getPublicSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function hasSupabaseEnv() {
  const { url, key } = getPublicSupabaseConfig();
  return Boolean(url && key);
}

export function requireServerEnv(name: "SUPABASE_SERVICE_ROLE_KEY" | "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}
