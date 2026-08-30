import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/portal" ||
    pathname.startsWith("/portal/")
  );
}

function loginRedirect(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const protectedPath = isProtectedPath(request.nextUrl.pathname);

  if (!url || !key) {
    return protectedPath ? loginRedirect(request) : NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    const { data: claimsData } = await supabase.auth.getClaims();
    if (protectedPath && !claimsData?.claims?.sub) {
      return loginRedirect(request);
    }
  } catch {
    if (protectedPath) {
      return loginRedirect(request);
    }
  }

  return response;
}
