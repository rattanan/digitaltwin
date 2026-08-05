import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPrefixes = ["/login", "/api/v1/auth", "/_next", "/favicon.ico", "/public"];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (publicPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return NextResponse.next();
  }

  const isProtected = path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/api/v1/");
  if (!isProtected) return NextResponse.next();

  const access = request.cookies.get("dt_access")?.value;
  if (access) return NextResponse.next();

  if (path.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, data: null, message: "กรุณาเข้าสู่ระบบ", errors: [], meta: undefined },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", path);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
