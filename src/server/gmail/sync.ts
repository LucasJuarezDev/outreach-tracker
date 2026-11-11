import "server-only";
import { gmail, type gmail_v1 } from "@googleapis/gmail";
import { companyFromEmail } from "@/lib/company";
import { parseThread, type MessageLite, type ParsedThread } from "@/lib/gmail-parse";
import { config } from "../config";
import { getPrisma } from "../db";
import { createOAuthClient } from "./oauth";

const HEADERS = ["From", "To", "Subject", "Date", "Auto-Submitted", "X-Autoreply", "X-Autorespond", "Precedence"];
const CONCURRENCY = 5;

export interface SyncResult {
  threads: number;
  created: number;
  updated: number;
  skipped: number;
}

export class GmailNotConnectedError extends Error {
  constructor() {
    super("No Gmail account is connected yet.");
  }
}

function toMessageLite(m: gmail_v1.Schema$Message): MessageLite {
  const headers: Record<string, string> = {};
  for (const h of m.payload?.headers ?? []) {
    if (h.name && h.value != null) headers[h.name.toLowerCase()] = h.value;
  }
  return {
    id: m.id ?? "",
    internalDate: Number(m.internalDate ?? 0),
    labelIds: m.labelIds ?? [],
    headers,
    snippet: m.snippet ?? "",
  };
}

async function listThreadIds(client: gmail_v1.Gmail, query: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const res = await client.users.threads.list({ userId: "me", q: query, maxResults: 100, pageToken });
    for (const t of res.data.threads ?? []) if (t.id) ids.push(t.id);
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return ids;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Upserts one parsed thread. Never overwrites what the user edited (outcome, notes, company fields). */
export async function saveThread(t: ParsedThread): Promise<"created" | "updated"> {
  const prisma = getPrisma();
  const identity = companyFromEmail(t.to.email, t.to.name);

  const company = await prisma.company.upsert({
    where: { domain: identity.domain },
    create: { domain: identity.domain, name: identity.name },
    update: {},
  });
  const existingContact = await prisma.contact.findUnique({ where: { email: t.to.email } });
  const contact = existingContact
    ? existingContact.name || !t.to.name
      ? existingContact
      : await prisma.contact.update({ where: { id: existingContact.id }, data: { name: t.to.name } })
    : await prisma.contact.create({ data: { email: t.to.email, name: t.to.name, companyId: company.id } });

  const facts = {
    subject: t.subject,
    sentAt: t.sentAt,
    followUpSentAt: t.followUpSentAt,
    firstReplyAt: t.firstReplyAt,
    lastReplyAt: t.lastReplyAt,
    replyCount: t.replyCount,
    autoReplyCount: t.autoReplyCount,
    lastReplySnippet: t.lastReplySnippet,
    bounced: t.bounced,
  };
  const existing = await prisma.outreach.findUnique({ where: { gmailThreadId: t.threadId }, select: { id: true } });
  if (existing) {
    await prisma.outreach.update({ where: { id: existing.id }, data: facts });
    return "updated";
  }
  await prisma.outreach.create({ data: { ...facts, gmailThreadId: t.threadId, contactId: contact.id } });
  return "created";
}

export async function syncGmail(): Promise<SyncResult> {
  const prisma = getPrisma();
  const account = await prisma.gmailAccount.findUnique({ where: { id: 1 } });
  if (!account) throw new GmailNotConnectedError();

  const authClient = createOAuthClient();
  authClient.setCredentials({ refresh_token: account.refreshToken });
  const client = gmail({ version: "v1", auth: authClient });

  const myEmails = new Set([account.email.toLowerCase()]);
  const threadIds = await listThreadIds(client, config.gmailQuery);

  const parsed = await mapLimit(threadIds, CONCURRENCY, async (id) => {
    const res = await client.users.threads.get({ userId: "me", id, format: "metadata", metadataHeaders: HEADERS });
    return parseThread(id, (res.data.messages ?? []).map(toMessageLite), myEmails);
  });

  const result: SyncResult = { threads: threadIds.length, created: 0, updated: 0, skipped: 0 };
  // Sequential writes: SQLite has a single writer and volumes are small.
  for (const thread of parsed) {
    if (!thread) {
      result.skipped += 1;
      continue;
    }
    result[await saveThread(thread)] += 1;
  }

  await prisma.gmailAccount.update({ where: { id: 1 }, data: { lastSyncAt: new Date() } });
  return result;
}
