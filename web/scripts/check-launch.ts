// Pre-launch checklist. Fails (exit 1) while anything blocking is outstanding. Run: npm run check:launch
// ✓ done · ✗ blocks launch · • a manual step this script can't verify (listed so it isn't forgotten)
import { config } from "dotenv";
import { LEGAL_DRAFT, SITE } from "@/lib/site";

config({ path: ".env.local" });

let blockers = 0;
const ok = (label: string) => console.log(`✓ ${label}`);
const block = (label: string, how: string) => {
  blockers++;
  console.log(`✗ ${label}\n    → ${how}`);
};
const manual = (label: string) => console.log(`• ${label}`);
const env = (k: string) => process.env[k] ?? "";

console.log("Legal and business details");
const placeholders = Object.entries(SITE).filter(([, v]) => /\[[A-Z ]{4,}\]/.test(String(v))).map(([k]) => k);
if (placeholders.length) block(`placeholders left in src/lib/site.ts: ${placeholders.join(", ")}`, "fill each one in (company name, contact email, governing law, refund policy)");
else ok("business details filled in");
if (LEGAL_DRAFT) block("privacy policy and terms are still marked as drafts", "have a lawyer review src/app/privacy and src/app/terms, then set LEGAL_DRAFT = false in src/lib/site.ts");
else ok("legal pages marked as reviewed");

console.log("\nPayments (Stripe)");
const key = env("STRIPE_SECRET_KEY");
if (!key) block("STRIPE_SECRET_KEY is not set", "add your key to the environment (sk_test_… while testing, sk_live_… at launch)");
else if (key.startsWith("sk_live_")) ok("Stripe is in LIVE mode");
else block("Stripe is still in TEST mode (sk_test_…)", "at launch, switch to live keys and recreate the $9 product, price, webhook and portal in live mode");
if (env("STRIPE_PRICE_ID")) ok("STRIPE_PRICE_ID is set");
else block("STRIPE_PRICE_ID is not set", "create the $9/month recurring Price and paste its id");
if (env("STRIPE_WEBHOOK_SECRET")) ok("STRIPE_WEBHOOK_SECRET is set");
else block("STRIPE_WEBHOOK_SECRET is not set", "add the webhook endpoint (https://YOUR-DOMAIN/api/stripe/webhook) in Stripe and paste its signing secret");
manual("Stripe webhook endpoint listens for: checkout.session.completed, customer.subscription.created / updated / deleted");
manual("Stripe Customer Portal is activated (cancel + update card + invoices) in the same mode");
manual("run `npm run check:stripe` against the keys you'll launch with");

console.log("\nHosting");
const app = env("APP_URL");
if (!app || /localhost|127\.0\.0\.1/.test(app)) block("APP_URL is missing or points at localhost", "set it to your public https:// address (Stripe return links and metadata use it)");
else if (/^https:\/\//.test(app)) ok(`APP_URL is ${app}`);
else block("APP_URL is not https", "the microphone and Stripe both require https");
if (env("DATABASE_URL") && env("NEON_AUTH_BASE_URL") && env("NEON_AUTH_COOKIE_SECRET") && env("OPENAI_API_KEY")) ok("database, auth and OpenAI variables are set locally");
else block("a core variable is missing (DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET, OPENAI_API_KEY)", "set them in your hosting provider's environment");
manual("add your production domain as a trusted origin in Neon Auth");
manual("run `npm run db:migrate && npm run db:seed` against the production database");

console.log("\nSecurity and cost");
manual("rotate the OpenAI key and the Neon database password that appeared in the early build sessions");
manual("raise the OpenAI rate limit above 200,000 tokens/minute before real traffic (each turn is 1-3 model calls)");
manual("set a monthly spend limit on the OpenAI account");
manual("try sign-up, a conversation, subscribing with a Stripe test card, cancelling in the portal, and deleting an account — end to end, on the deployed site");

console.log(`\n${blockers ? `${blockers} blocker(s) before launch.` : "No blockers found."}`);
process.exit(blockers ? 1 : 0);
