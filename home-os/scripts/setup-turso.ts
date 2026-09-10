/**
 * One-shot production setup: creates the schema on a Turso database and
 * loads it with the family's data — everything the manual "run each
 * migration, then seed" flow needed, in a single command:
 *
 *   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx tsx scripts/setup-turso.ts
 *
 * Safe to point at an empty, freshly-created Turso database. Re-running it
 * against a database that already has the schema will fail loudly on the
 * first "table already exists" statement — that's the signal it's already
 * set up, not a partial/broken state.
 */
import { createClient } from "@libsql/client";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { seedHomeOS } from "../prisma/seed";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error(
      "Zet TURSO_DATABASE_URL (en TURSO_AUTH_TOKEN) voordat je dit script draait, bijv.:\n" +
        '  TURSO_DATABASE_URL="libsql://jouw-db.turso.io" TURSO_AUTH_TOKEN="..." npx tsx scripts/setup-turso.ts'
    );
    process.exit(1);
  }

  console.log("1/2 — Schema aanmaken op Turso...");
  const rawClient = createClient({ url, authToken });
  const migrationsDir = join(__dirname, "..", "prisma", "migrations");
  const migrationFolders = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const folder of migrationFolders) {
    const sql = readFileSync(join(migrationsDir, folder, "migration.sql"), "utf8");
    await rawClient.executeMultiple(sql);
    console.log(`   ✓ ${folder}`);
  }
  rawClient.close();

  console.log("\n2/2 — Gezinsdata inladen...");
  const adapter = new PrismaLibSQL({ url, authToken });
  const prisma = new PrismaClient({ adapter });
  await seedHomeOS(prisma);
  await prisma.$disconnect();

  console.log("\nKlaar! De Turso-database staat klaar voor de deploy.");
}

main().catch((e) => {
  console.error("\nSetup mislukt:", e);
  process.exit(1);
});
