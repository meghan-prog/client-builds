import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple HTTP Basic Auth gate for the whole app. This is a family app with
// real personal data (names, birthdates, routines) — it should not be
// reachable by anyone who happens to find the deploy URL.
//
// Configure via env vars in Netlify: SITE_USERNAME (optional, defaults to
// "gezin") and SITE_PASSWORD (required to enable protection). Without
// SITE_PASSWORD set, the site is left open — this keeps local dev friction-
// free, so make sure SITE_PASSWORD is set before/at first production deploy.
const SITE_USERNAME = process.env.SITE_USERNAME ?? "gezin";
const SITE_PASSWORD = process.env.SITE_PASSWORD;

export function proxy(request: NextRequest) {
  if (!SITE_PASSWORD) return NextResponse.next();

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice("Basic ".length), "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    const user = decoded.slice(0, separatorIndex);
    const pass = decoded.slice(separatorIndex + 1);
    if (user === SITE_USERNAME && pass === SITE_PASSWORD) {
      return NextResponse.next();
    }
  }

  return new Response("Authenticatie vereist", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Home OS"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
