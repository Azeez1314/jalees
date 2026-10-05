// Applies db/schema.sql. Idempotent. Run: npm run db:migrate
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "@/lib/db";
import { splitStatements } from "./split-sql";

config({ path: ".env.local" });

async function main() {
  const schema = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  const statements = splitStatements(schema);

  for (const stmt of statements) {
    await sql().query(stmt);
  }
  console.log(`Applied ${statements.length} statements.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
