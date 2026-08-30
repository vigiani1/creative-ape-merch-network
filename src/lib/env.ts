export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function requireServerEnv(name: "SUPABASE_SERVICE_ROLE_KEY" | "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}
