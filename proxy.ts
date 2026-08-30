import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PLATFORM_HOST = "creative-ape-merch-network.vercel.app";

function hostname(request: NextRequest) {
  return (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();
}

function isPlatformHost(host: string) {
  return !host ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === PLATFORM_HOST ||
    host.endsWith(".vercel.app");
}

export async function proxy(request: NextRequest) {
  const host = hostname(request);
  const pathname = request.nextUrl.pathname;
  const customDomain = !isPlatformHost(host);

  if (customDomain && (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/portal" ||
    pathname.startsWith("/portal/") ||
    pathname === "/login"
  )) {
    const loginUrl = new URL("https://" + PLATFORM_HOST + "/login");
    loginUrl.searchParams.set("next", "/admin");
    return NextResponse.redirect(loginUrl);
  }

  if (customDomain && pathname.startsWith("/api/admin/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
