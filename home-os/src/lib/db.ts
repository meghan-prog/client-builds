import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Local dev uses a plain SQLite file via DATABASE_URL, exactly as before —
// nothing changes for `npm run dev`.
//
// In production, set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (a free Turso
// database — https://turso.tech) and the app talks to it over libSQL's
// HTTP protocol via this driver adapter instead: a normal env-var
// connection that works on any standard Node.js host (Netlify, Railway,
// Render, a VPS, Vercel, ...).
//
// Note: this does NOT work on Cloudflare Workers today. Prisma's generated
// client is supposed to auto-select its WASM engine there via a "workerd"
// export condition, but OpenNext's Cloudflare bundler doesn't thread that
// condition through, and the packaged fallback (importing
// "@prisma/client/wasm" directly) ships with a broken .mjs reference in
// this Prisma version — confirmed by actually building and running this
// app under `wrangler dev`, not just reading docs. Cloudflare Workers is
// a real option for a version of this app that drops Prisma for something
// Workers-native (Drizzle + D1, or D1's raw client), just not a drop-in
// swap for the current data layer.
function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;

  if (tursoUrl) {
    const adapter = new PrismaLibSQL({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN });
    return new PrismaClient({ adapter, log: ["error"] });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
