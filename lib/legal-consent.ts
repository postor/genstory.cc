export const LEGAL_CONSENT_VERSION = "2026-07-31";

const LEGAL_CONSENT_STORAGE_KEY = "genstory-legal-consent";

export function hasAcceptedLegalTerms(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return (
      window.localStorage.getItem(LEGAL_CONSENT_STORAGE_KEY) ===
      LEGAL_CONSENT_VERSION
    );
  } catch {
    return false;
  }
}

export function recordLegalTermsAcceptance(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      LEGAL_CONSENT_STORAGE_KEY,
      LEGAL_CONSENT_VERSION,
    );
  } catch {
    // Storage may be unavailable in private or restricted browsing contexts.
  }
}
