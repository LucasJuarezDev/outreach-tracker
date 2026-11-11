const FREE_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.com.ar",
  "outlook.com",
  "outlook.com.ar",
  "live.com",
  "live.com.ar",
  "yahoo.com",
  "yahoo.com.ar",
  "icloud.com",
  "me.com",
  "protonmail.com",
  "proton.me",
  "aol.com",
]);

/** Second-level public suffixes common in the target markets (e.g. "com.ar"). */
const SECOND_LEVEL = new Set(["com", "net", "org", "co", "gob", "gov", "edu", "ltd"]);

export interface CompanyIdentity {
  /** Stable grouping key: the email domain, or "personal:<email>" for free providers. */
  domain: string;
  name: string;
}

function capitalize(word: string): string {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

/** "ventas@www.rio-sur.com.ar" → "Rio Sur" */
export function nameFromDomain(domain: string): string {
  const labels = domain.toLowerCase().replace(/^www\./, "").split(".");
  if (labels.length >= 3 && SECOND_LEVEL.has(labels[labels.length - 2]!) && labels[labels.length - 1]!.length === 2) {
    labels.splice(-2);
  } else {
    labels.splice(-1);
  }
  const base = labels[labels.length - 1] ?? domain;
  return base.split(/[-_]/).filter(Boolean).map(capitalize).join(" ");
}

export function companyFromEmail(email: string, displayName?: string | null): CompanyIdentity {
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split("@")[1] ?? "";
  if (!domain || FREE_PROVIDERS.has(domain)) {
    return { domain: `personal:${normalized}`, name: displayName?.trim() || normalized.split("@")[0] || normalized };
  }
  return { domain, name: nameFromDomain(domain) };
}
