/**
 * Facts about the business that only the owner can supply. Anything wrapped in [SQUARE BRACKETS] is a placeholder that renders
 * visibly on the legal pages, and `npm run check:launch` fails until none are left and LEGAL_DRAFT is false.
 */
export const SITE = {
  name: "Jalees",
  /** The legal entity that operates the service. */
  operator: "[YOUR COMPANY NAME]",
  /** Where learners reach a human for privacy and billing questions. */
  contactEmail: "[YOUR CONTACT EMAIL]",
  /** Jurisdiction whose law governs the terms. */
  governingLaw: "[GOVERNING LAW]",
  /** Refund policy is a business decision; the terms quote this. */
  refundPolicy: "[YOUR REFUND POLICY]",
  lastUpdated: "8 October 2026",
};

/**
 * The privacy policy and terms below were written from what the app actually does, but they are DRAFTS and are not legal advice.
 * While true, both pages show a banner saying so. Set to false only after a lawyer has reviewed them.
 */
export const LEGAL_DRAFT = true;
