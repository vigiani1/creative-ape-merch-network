import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { getPublicSupabaseUrl } from "@/lib/env";

type PublicConfig = {
  url: string;
  anonKey: string;
};

async function getPublicConfig(): Promise<PublicConfig> {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (envUrl && envKey) return { url: envUrl, anonKey: envKey };

  const url = getPublicSupabaseUrl();
  const response = await fetch(`${url}/functions/v1/public-config`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Unable to load public Supabase configuration.");
  }

  return response.json() as Promise<PublicConfig>;
}

export async function createClient() {
  const { url, anonKey } = await getPublicConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write cookies. proxy.ts handles refresh writes.
        }
      },
    },
  });
}
