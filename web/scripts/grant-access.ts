// Gives a learner free access without Stripe (the owner, testers, partners).
// Usage: npx tsx scripts/grant-access.ts <email|userId> [days]     (no days = open-ended)
//        npx tsx scripts/grant-access.ts <email|userId> revoke
import { config } from "dotenv";
import { sql } from "@/lib/db";
import { getAccess, getSubscription, grantComp } from "@/lib/subscriptions";

config({ path: ".env.local" });

async function resolveUser(who: string): Promise<string | null> {
  const db = sql();
  if (who.includes("@")) {
    const rows = await db`SELECT id FROM neon_auth."user" WHERE lower(email) = lower(${who}) LIMIT 1`;
    return rows.length ? String(rows[0].id) : null;
  }
  const inAuth = await db`SELECT id FROM neon_auth."user" WHERE id::text = ${who} LIMIT 1`;
  if (inAuth.length) return who;
  return (await db`SELECT user_id FROM profiles WHERE user_id = ${who}`).length ? who : null;
}

async function main() {
  const [who, arg] = process.argv.slice(2);
  if (!who) {
    console.error("Usage: npx tsx scripts/grant-access.ts <email|userId> [days|revoke]");
    process.exit(1);
  }
  const userId = await resolveUser(who);
  if (!userId) {
    console.error(`No learner found for "${who}". (Use the email they signed in with, or their id from Neon → Auth → Users.)`);
    process.exit(1);
  }

  if (arg === "revoke") {
    const current = await getSubscription(userId);
    if (current?.plan !== "comp") {
      console.log("That learner has no comp to revoke (their access comes from the trial or a paid subscription).");
      return;
    }
    await sql()`UPDATE subscriptions SET status = 'canceled', updated_at = now() WHERE user_id = ${userId} AND plan = 'comp'`;
  } else {
    const days = arg === undefined ? null : Number(arg);
    if (days !== null && (!Number.isFinite(days) || days <= 0)) {
      console.error('days must be a positive number, or leave it out for open-ended access, or use "revoke".');
      process.exit(1);
    }
    await grantComp(userId, days);
  }
  const access = await getAccess(userId);
  console.log(`Done. Access is now: ${access.reason}${access.endsAt ? ` until ${access.endsAt.toISOString().slice(0, 10)}` : ""} (allowed: ${access.allowed}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
