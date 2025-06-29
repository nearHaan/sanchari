import { NextResponse } from "next/server";
import { getSession } from "./lib/auth";

export function middleware(request) {
  const session = request.cookies.get("session_user");

  if (!session && request.nextUrl.pathname === "/edit_map") {
    const redirectURL = new URL("/", request.url);
    redirectURL.searchParams.set("unauthorized", true);
    return NextResponse.redirect(redirectURL);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/edit_map"],
};
