import { NextRequest, NextResponse } from "next/server";
import { decryptToken, SESSION_COOKIE } from "@/lib/jwt";

const protectedPrefixes = ["/finanzas", "/fotografia"];
const publicRoutes = ["/login", "/"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isProtected = protectedPrefixes.some((prefix) => path.startsWith(prefix));

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await decryptToken(token) : null;

  if (isProtected && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (publicRoutes.includes(path) && session?.userId && path === "/login") {
    return NextResponse.redirect(new URL("/finanzas", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
