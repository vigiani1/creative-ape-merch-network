import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isValidHttpsUrl(value: string | undefined) {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isValidSupabaseUrl(value: string | undefined) {
  if (!isValidHttpsUrl(value)) return false;
  return new URL(value as string).hostname.endsWith(".supabase.co");
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const checks: Record<string, boolean> = {
    supabaseUrlPresent: Boolean(supabaseUrl),
    supabaseUrlValid: isValidSupabaseUrl(supabaseUrl),
    supabasePublishableKeyPresent: Boolean(publishableKey),
    supabasePublishableKeyLooksValid: Boolean(
      publishableKey?.startsWith("sb_publishable_") || publishableKey?.startsWith("eyJ")
    ),
    appUrlPresent: Boolean(appUrl),
    appUrlValid: isValidHttpsUrl(appUrl),
    serviceRoleKeyPresent: Boolean(serviceRoleKey),
    serviceRoleKeyLooksValid: Boolean(serviceRoleKey?.startsWith("sb_secret_") || serviceRoleKey?.startsWith("eyJ")),
    stripeSecretPresent: Boolean(stripeSecret),
    stripeSecretLooksTestMode: Boolean(stripeSecret?.startsWith("sk_test_")),
    stripeWebhookSecretPresent: Boolean(stripeWebhookSecret),
    stripeWebhookSecretLooksValid: Boolean(stripeWebhookSecret?.startsWith("whsec_")),
  };

  let authStatus: number | null = null;
  let databaseStatus: number | null = null;

  if (checks.supabaseUrlValid && publishableKey) {
    try {
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: publishableKey },
        cache: "no-store",
      });
      authStatus = authResponse.status;
      checks.supabaseAuthReachable = authResponse.ok;
    } catch {
      checks.supabaseAuthReachable = false;
    }

    try {
      const dbResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=0`, {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
        cache: "no-store",
      });
      databaseStatus = dbResponse.status;
      checks.supabaseDatabaseReachable = dbResponse.ok;
    } catch {
      checks.supabaseDatabaseReachable = false;
    }
  } else {
    checks.supabaseAuthReachable = false;
    checks.supabaseDatabaseReachable = false;
  }

  const ok = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      ok,
      checks,
      upstream: {
        supabaseAuthStatus: authStatus,
        supabaseDatabaseStatus: databaseStatus,
      },
    },
    { status: ok ? 200 : 503 }
  );
}
