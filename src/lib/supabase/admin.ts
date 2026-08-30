import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireServerEnv } from "@/lib/env";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return createClient(url, requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
