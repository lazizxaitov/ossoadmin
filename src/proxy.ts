import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";

export async function proxy(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (isLoginPage && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!isLoginPage && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|api/mobile|api/payments/click|payment/result|privacy|terms|_next/static|_next/image|favicon.ico|uploads).*)"],
};
