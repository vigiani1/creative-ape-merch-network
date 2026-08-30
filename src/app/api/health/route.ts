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
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const coreChecks: Record<string, boolean> = {
    supabaseUrlPresent: Boolean(supabaseUrl),
    supabaseUrlValid: isValidSupabaseUrl(supabaseUrl),
    supabasePublishableKeyPresent: Boolean(publishableKey),
    supabasePublishableKeyLooksValid: Boolean(
      publishableKey?.startsWith("sb_publishable_") || publishableKey?.startsWith("eyJ")
    ),
    appUrlPresent: Boolean(appUrl),
    appUrlValid: isValidHttpsUrl(appUrl),
    serviceRoleKeyPresent: Boolean(serviceRoleKey),
    serviceRoleKeyLooksValid: Boolean(
      serviceRoleKey?.startsWith("sb_secret_") || serviceRoleKey?.startsWith("eyJ")
    ),
  };

  const optionalIntegrations = {
    stripe: {
      configured: Boolean(stripeSecret && stripeWebhookSecret && stripePublishableKey),
      secretKeyPresent: Boolean(stripeSecret),
      secretKeyLooksTestMode: Boolean(stripeSecret?.startsWith("sk_test_")),
      webhookSecretPresent: Boolean(stripeWebhookSecret),
      webhookSecretLooksValid: Boolean(stripeWebhookSecret?.startsWith("whsec_")),
      publishableKeyPresent: Boolean(stripePublishableKey),
      publishableKeyLooksTestMode: Boolean(stripePublishableKey?.startsWith("pk_test_")),
    },
  };

  let authStatus: number | null = null;
  let databaseStatus: number | null = null;

  if (coreChecks.supabaseUrlValid && publishableKey) {
    try {
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: publishableKey },
        cache: "no-store",
      });
      authStatus = authResponse.status;
      coreChecks.supabaseAuthReachable = authResponse.ok;
    } catch {
      coreChecks.supabaseAuthReachable = false;
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
      coreChecks.supabaseDatabaseReachable = dbResponse.ok;
    } catch {
      coreChecks.supabaseDatabaseReachable = false;
    }
  } else {
    coreChecks.supabaseAuthReachable = false;
    coreChecks.supabaseDatabaseReachable = false;
  }

  const ok = Object.values(coreChecks).every(Boolean);

  return NextResponse.json(
    {
      ok,
      coreChecks,
      optionalIntegrations,
      upstream: {
        supabaseAuthStatus: authStatus,
        supabaseDatabaseStatus: databaseStatus,
      },
    },
    { status: ok ? 200 : 503 }
  );
}
