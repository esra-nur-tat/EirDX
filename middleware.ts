import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // ✅ If the user is already logged in, do not redirect to the login page.
  if (user && req.nextUrl.pathname.startsWith("/login")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ❌ If the user is not logged in, do not allow access to protected pages.
  if (
    (!user || error) &&
    (req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/admin-panel") ||
      req.nextUrl.pathname.startsWith("/settings") ||
      req.nextUrl.pathname.startsWith("/logout") ||
      req.nextUrl.pathname.startsWith("/patients"))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // middleware.ts
  const { data: profile } = await supabase
    .from("doctors")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (req.nextUrl.pathname.startsWith("/admin-panel")) {
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // 🔐 Role control
  if (req.nextUrl.pathname.startsWith("/admin-panel")) {
    const role = profile?.role;
    if (role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin-panel/:path*",
    "/login",
    "/settings",
    "/logout",
    "/patients/:path*",
  ],
};
