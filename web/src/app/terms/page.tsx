import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { PRICE_LABEL, TRIAL_DAYS } from "@/lib/plans";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms — Jalees", description: "The terms of using Jalees, including the free trial and subscription." };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of use">
      <section>
        <h2>The service</h2>
        <p>
          Jalees is an Arabic conversation-practice service operated by {SITE.operator} (&ldquo;we&rdquo;). By creating an account you agree to these
          terms and to our <a href="/privacy" className="underline">Privacy</a> page.
        </p>
      </section>

      <section>
        <h2>Free trial and subscription</h2>
        <ul>
          <li>Every new account gets a {TRIAL_DAYS}-day free trial. No payment details are needed for the trial.</li>
          <li>After the trial, talking with the buddy needs a subscription of {PRICE_LABEL}, billed monthly through Stripe until you cancel. Without one you can still use mistake review, your notes, your account and billing pages.</li>
          <li>You can cancel at any time from <em>Manage billing</em>. You keep access until the end of the period you have paid for; we do not charge again after that.</li>
          <li>Refunds: {SITE.refundPolicy}.</li>
          <li>We may change the price with notice; a change applies from your next renewal.</li>
          <li>Voice practice has a daily limit of 10 minutes so that every learner can be served fairly.</li>
        </ul>
      </section>

      <section>
        <h2>What Jalees is — and is not</h2>
        <ul>
          <li>It is a practice partner that keeps to the Arabic you have already studied. It is not a teacher, an examiner or a certified assessment.</li>
          <li>The buddy is an AI. It can make mistakes, including in Arabic grammar and in the corrections it gives. Use your judgement and your teachers and textbooks as the authority.</li>
          <li>Jalees does not quote the Qur&apos;an or hadith and does not give religious rulings or advice.</li>
        </ul>
      </section>

      <section>
        <h2>Using it fairly</h2>
        <p>Use Jalees for your own learning. Do not try to break, overload or reverse-engineer it, share your account, resell access, or use it to produce unlawful, abusive or harmful content. We may suspend accounts that do.</p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>What you type or say remains yours. You allow us, and the providers listed in our privacy page, to process it only to run the service for you. You can download or delete it at any time.</p>
      </section>

      <section>
        <h2>Availability and changes</h2>
        <p>We work to keep Jalees running but cannot promise it will always be available or error-free, and we may change or retire features. Lessons currently covered are listed on the home page.</p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          To the extent the law allows, we are not liable for indirect or consequential loss, and our total liability to you for any claim is limited to
          what you paid us in the 12 months before it. Nothing here limits rights you have under consumer law that cannot be excluded.
        </p>
      </section>

      <section>
        <h2>Ending your account</h2>
        <p>You can delete your account and data yourself from <em>Account &amp; data</em>. We may end or suspend access if these terms are broken.</p>
      </section>

      <section>
        <h2>Law and contact</h2>
        <p>These terms are governed by the law of {SITE.governingLaw}. Questions: {SITE.contactEmail}.</p>
      </section>
    </LegalLayout>
  );
}
