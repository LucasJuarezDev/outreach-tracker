/** Minimal, API-independent view of a Gmail message (headers keyed in lowercase). */
export interface MessageLite {
  id: string;
  internalDate: number;
  labelIds: string[];
  headers: Record<string, string>;
  snippet: string;
}

export interface Address {
  name: string | null;
  email: string;
}

export interface ParsedThread {
  threadId: string;
  subject: string;
  to: Address;
  sentAt: Date;
  followUpSentAt: Date | null;
  firstReplyAt: Date | null;
  lastReplyAt: Date | null;
  replyCount: number;
  autoReplyCount: number;
  lastReplySnippet: string | null;
  bounced: boolean;
}

/** Parses the first address of a header such as `"Pérez, Ana" <ana@x.com>, b@y.com`. */
export function parseAddress(header: string | undefined): Address | null {
  if (!header) return null;
  const angle = header.match(/^\s*(?:"?([^"<]*?)"?\s*)?<([^>]+)>/);
  if (angle) {
    const name = angle[1]?.trim() || null;
    return { name, email: angle[2]!.trim().toLowerCase() };
  }
  const bare = header.split(",")[0]?.trim();
  return bare && bare.includes("@") ? { name: null, email: bare.toLowerCase() } : null;
}

const BOUNCE_FROM = /mailer-daemon|postmaster/i;
const BOUNCE_SUBJECT =
  /delivery status notification|undeliver|mail delivery (failed|subsystem)|returned mail|no se (ha podido|pudo) entregar|entrega fallida/i;
const AUTO_SUBJECT =
  /^(re:\s*)?(automatic reply|auto(matic)?[- ]?reply|autoreply|out of (the )?office|respuesta autom[aá]tica|fuera de (la )?oficina|ausencia|resposta autom[aá]tica)/i;

export function isBounce(m: MessageLite): boolean {
  return BOUNCE_FROM.test(m.headers.from ?? "") || BOUNCE_SUBJECT.test(m.headers.subject ?? "");
}

export function isAutoReply(m: MessageLite): boolean {
  const h = m.headers;
  const autoSubmitted = h["auto-submitted"]?.toLowerCase();
  if (autoSubmitted && autoSubmitted !== "no") return true;
  if (h["x-autoreply"] || h["x-autorespond"]) return true;
  if (h.precedence?.toLowerCase() === "auto_reply") return true;
  return AUTO_SUBJECT.test(h.subject ?? "");
}

function isFromMe(m: MessageLite, myEmails: ReadonlySet<string>): boolean {
  if (m.labelIds.includes("SENT")) return true;
  const from = parseAddress(m.headers.from);
  return from != null && myEmails.has(from.email);
}

/**
 * Turns a thread into prospecting facts. Returns null when the thread was not
 * started by us (e.g. an inbound email that happens to match the search).
 */
export function parseThread(threadId: string, messages: MessageLite[], myEmails: ReadonlySet<string>): ParsedThread | null {
  const ordered = [...messages].sort((a, b) => a.internalDate - b.internalDate);
  const first = ordered[0];
  if (!first || !isFromMe(first, myEmails)) return null;
  const to = parseAddress(first.headers.to);
  if (!to) return null;

  const result: ParsedThread = {
    threadId,
    subject: first.headers.subject?.trim() || "(no subject)",
    to,
    sentAt: new Date(first.internalDate),
    followUpSentAt: null,
    firstReplyAt: null,
    lastReplyAt: null,
    replyCount: 0,
    autoReplyCount: 0,
    lastReplySnippet: null,
    bounced: false,
  };

  for (const m of ordered.slice(1)) {
    const at = new Date(m.internalDate);
    if (isFromMe(m, myEmails)) {
      // Only the first message of ours sent before any reply counts as the follow-up.
      if (!result.followUpSentAt && result.replyCount === 0) result.followUpSentAt = at;
    } else if (isBounce(m)) {
      result.bounced = true;
    } else if (isAutoReply(m)) {
      result.autoReplyCount += 1;
    } else {
      result.replyCount += 1;
      result.firstReplyAt ??= at;
      result.lastReplyAt = at;
      result.lastReplySnippet = m.snippet || null;
    }
  }
  return result;
}
