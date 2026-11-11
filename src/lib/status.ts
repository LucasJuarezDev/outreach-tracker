import { addDays } from "./dates";
import type { Outreach, Status } from "./types";

export const DEFAULT_FOLLOW_UP_DAYS = 7;

type StatusInput = Pick<Outreach, "bounced" | "outcome" | "replyCount" | "sentAt" | "followUpSentAt">;

/**
 * Single source of truth for the status of an outreach:
 * a bounce wins, then the user's decision, then an unread human reply,
 * and otherwise the follow-up clock (one reminder, then the thread is closed).
 */
export function deriveStatus(o: StatusInput, now: Date, followUpDays = DEFAULT_FOLLOW_UP_DAYS): Status {
  if (o.bounced) return "BOUNCED";
  if (o.outcome !== "PENDING") return o.outcome;
  if (o.replyCount > 0) return "NEEDS_REVIEW";
  if (o.followUpSentAt) {
    return now >= addDays(o.followUpSentAt, followUpDays) ? "NO_RESPONSE" : "AWAITING_REPLY";
  }
  return now >= addDays(o.sentAt, followUpDays) ? "FOLLOW_UP_DUE" : "AWAITING_REPLY";
}

/** Date on which the follow-up becomes due, or null when none is pending. */
export function followUpDueDate(o: StatusInput, followUpDays = DEFAULT_FOLLOW_UP_DAYS): Date | null {
  if (o.bounced || o.outcome !== "PENDING" || o.replyCount > 0 || o.followUpSentAt) return null;
  return addDays(o.sentAt, followUpDays);
}

/** Statuses that ask the user to do something today. */
export const ACTION_STATUSES: readonly Status[] = ["NEEDS_REVIEW", "FOLLOW_UP_DUE"];

/** Visual tone per status: the reserved status colors only where they mean something. */
export type StatusTone = "good" | "warning" | "critical" | "accent" | "neutral" | "muted";

export const STATUS_TONE: Record<Status, StatusTone> = {
  AWAITING_REPLY: "neutral",
  FOLLOW_UP_DUE: "warning",
  NO_RESPONSE: "muted",
  NEEDS_REVIEW: "accent",
  INTERESTED: "good",
  MORE_INFO: "good",
  LATER: "neutral",
  NOT_INTERESTED: "muted",
  UNSUBSCRIBED: "muted",
  BOUNCED: "critical",
};
