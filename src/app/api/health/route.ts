import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isValidSupabaseUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const checks: Record<string, boolean> = {
    supabaseUrlPresent: Boolean(supabaseUrl),
    supabaseUrlValid: isValidSupabaseUrl(supabaseUrl),
    supabasePublishableKeyPresent: Boolean(publishableKey),
    supabasePublishableKeyLooksValid: Boolean(
      publishableKey?.startsWith("sb_publishable_") || publishableKey?.startsWith("eyJ")
    ),
    appUrlPresent: Boolean(appUrl),
    stripeSecretPresent: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhookSecretPresent: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  };

  let supabaseReachable = false;
  let supabaseStatus: number | null = null;

  if (checks.supabaseUrlValid && publishableKey) {
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: publishableKey },
        cache: "no-store",
      });
      supabaseStatus = response.status;
      supabaseReachable = response.ok;
    } catch {
      supabaseReachable = false;
    }
  }

  checks.supabaseReachable = supabaseReachable;
  const ok = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      ok,
      checks,
      supabaseStatus,
      runtime: "vercel",
    },
    { status: ok ? 200 : 503 }
  );
}
