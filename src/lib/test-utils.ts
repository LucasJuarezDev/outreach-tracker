import type { Outreach } from "./types";

let seq = 0;

/** Builds an Outreach with sensible defaults for tests. */
export function makeOutreach(overrides: Partial<Outreach> = {}): Outreach {
  seq += 1;
  return {
    id: `o${seq}`,
    gmailThreadId: `t${seq}`,
    subject: "software para exportadores",
    sentAt: new Date("2026-11-02T13:00:00Z"),
    followUpSentAt: null,
    firstReplyAt: null,
    lastReplyAt: null,
    replyCount: 0,
    autoReplyCount: 0,
    lastReplySnippet: null,
    bounced: false,
    outcome: "PENDING",
    notes: null,
    contact: { id: `c${seq}`, email: `a${seq}@acme.example`, name: null, role: null },
    company: {
      id: `co${seq}`,
      name: "Acme",
      domain: "acme.example",
      website: null,
      location: null,
      ring: null,
      segment: null,
      notes: null,
    },
    ...overrides,
  };
}
