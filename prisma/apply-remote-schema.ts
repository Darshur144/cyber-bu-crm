// Applies a migration.sql file directly to a Turso/libSQL database.
// Needed because `prisma migrate deploy` doesn't accept libsql:// URLs for SQLite
// (the migration engine only understands file: URLs; the libsql adapter is
// runtime-only, used by PrismaClient, not by the CLI's migration engine).
//
// Usage: DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx prisma/apply-remote-schema.ts <migration-folder-name>
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const migrationDir = process.argv[2];

if (!url) throw new Error("DATABASE_URL is required");
if (!migrationDir) {
  throw new Error("Usage: tsx prisma/apply-remote-schema.ts <migration-folder-name>");
}

const sql = readFileSync(join("prisma/migrations", migrationDir, "migration.sql"), "utf-8");

const client = createClient({ url, authToken });

client
  .executeMultiple(sql)
  .then(() => {
    console.log("Applied migration:", migrationDir);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
