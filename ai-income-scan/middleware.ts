import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/admin/:path*"],
};

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  // Geen credentials geconfigureerd: admin blijft ontoegankelijk i.p.v. open.
  if (!user || !pass) {
    return new NextResponse("Admin is niet geconfigureerd (ADMIN_USER/ADMIN_PASSWORD ontbreken).", {
      status: 503,
    });
  }

  const authHeader = req.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const [reqUser, reqPass] = decoded.split(":");
      if (reqUser === user && reqPass === pass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authenticatie vereist.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AI Income Scan Admin"' },
  });
}
