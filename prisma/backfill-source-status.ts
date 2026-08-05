// Safe, non-destructive backfill: sets Deal.sourceStatus on already-imported
// rows (matched by externalDealId, falling back to title) without deleting anything.
// Usage: npx tsx prisma/backfill-source-status.ts <import_ready.json>
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: tsx prisma/backfill-source-status.ts <import_ready.json>");
  const data = JSON.parse(readFileSync(path, "utf-8"));

  let updatedByExternalId = 0;
  let updatedByTitle = 0;
  let notFound = 0;

  for (const d of data.deals) {
    if (d.externalDealId) {
      const res = await client.execute({
        sql: `UPDATE Deal SET sourceStatus = ? WHERE externalDealId = ?`,
        args: [d.rawStatusText, d.externalDealId],
      });
      if (res.rowsAffected > 0) {
        updatedByExternalId += res.rowsAffected;
        continue;
      }
    }
    const res = await client.execute({
      sql: `UPDATE Deal SET sourceStatus = ? WHERE title = ? AND sourceStatus IS NULL`,
      args: [d.rawStatusText, d.title],
    });
    if (res.rowsAffected > 0) {
      updatedByTitle += res.rowsAffected;
    } else {
      notFound++;
    }
  }

  console.log({ updatedByExternalId, updatedByTitle, notFound });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
