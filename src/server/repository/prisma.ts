import "server-only";
import type { Prisma } from "@prisma/client";
import { OUTCOMES, type Outcome, type Outreach } from "@/lib/types";
import { getPrisma } from "../db";
import type { Repository } from "./types";

const include = { contact: { include: { company: true } } } satisfies Prisma.OutreachInclude;
type Row = Prisma.OutreachGetPayload<{ include: typeof include }>;

const asOutcome = (value: string): Outcome => ((OUTCOMES as readonly string[]).includes(value) ? (value as Outcome) : "PENDING");

function toOutreach(row: Row): Outreach {
  const { contact, ...o } = row;
  const { company, ...c } = contact;
  return {
    id: o.id,
    gmailThreadId: o.gmailThreadId,
    subject: o.subject,
    sentAt: o.sentAt,
    followUpSentAt: o.followUpSentAt,
    firstReplyAt: o.firstReplyAt,
    lastReplyAt: o.lastReplyAt,
    replyCount: o.replyCount,
    autoReplyCount: o.autoReplyCount,
    lastReplySnippet: o.lastReplySnippet,
    bounced: o.bounced,
    outcome: asOutcome(o.outcome),
    notes: o.notes,
    contact: { id: c.id, email: c.email, name: c.name, role: c.role },
    company: {
      id: company.id,
      name: company.name,
      domain: company.domain,
      website: company.website,
      location: company.location,
      ring: company.ring,
      segment: company.segment,
      notes: company.notes,
    },
  };
}

export const prismaRepository: Repository = {
  async listOutreaches() {
    const rows = await getPrisma().outreach.findMany({ include, orderBy: { sentAt: "desc" } });
    return rows.map(toOutreach);
  },
  async getOutreach(id) {
    const row = await getPrisma().outreach.findUnique({ where: { id }, include });
    return row ? toOutreach(row) : null;
  },
  async setOutcome(id, outcome) {
    await getPrisma().outreach.update({ where: { id }, data: { outcome } });
  },
  async setNotes(id, notes) {
    await getPrisma().outreach.update({ where: { id }, data: { notes } });
  },
  async updateCompany(id, patch) {
    await getPrisma().company.update({ where: { id }, data: patch });
  },
  async getGmailConnection() {
    const account = await getPrisma().gmailAccount.findUnique({ where: { id: 1 } });
    return account ? { email: account.email, lastSyncAt: account.lastSyncAt } : null;
  },
};
