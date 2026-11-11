/** What the user decided after reading a reply. Set manually, never by the sync. */
export const OUTCOMES = [
  "PENDING",
  "INTERESTED",
  "MORE_INFO",
  "LATER",
  "NOT_INTERESTED",
  "UNSUBSCRIBED",
] as const;
export type Outcome = (typeof OUTCOMES)[number];

/** Status shown in the UI, derived from the synced facts plus the outcome. */
export const STATUSES = [
  "AWAITING_REPLY",
  "FOLLOW_UP_DUE",
  "NO_RESPONSE",
  "NEEDS_REVIEW",
  "INTERESTED",
  "MORE_INFO",
  "LATER",
  "NOT_INTERESTED",
  "UNSUBSCRIBED",
  "BOUNCED",
] as const;
export type Status = (typeof STATUSES)[number];

export interface Company {
  id: string;
  name: string;
  domain: string;
  website: string | null;
  location: string | null;
  ring: number | null;
  segment: string | null;
  notes: string | null;
}

export interface Contact {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
}

export interface Outreach {
  id: string;
  gmailThreadId: string;
  subject: string;
  sentAt: Date;
  followUpSentAt: Date | null;
  firstReplyAt: Date | null;
  lastReplyAt: Date | null;
  /** Human replies only (auto-replies and bounces are counted apart). */
  replyCount: number;
  autoReplyCount: number;
  lastReplySnippet: string | null;
  bounced: boolean;
  outcome: Outcome;
  notes: string | null;
  contact: Contact;
  company: Company;
}

export type CompanyPatch = Partial<Pick<Company, "name" | "website" | "location" | "ring" | "segment" | "notes">>;
