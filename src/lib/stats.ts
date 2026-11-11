import { addDays, startOfWeek } from "./dates";
import { deriveStatus } from "./status";
import { STATUSES, type Outreach, type Status } from "./types";

export interface WeekPoint {
  weekStart: Date;
  sent: number;
  /** Emails sent that week that later got a human reply. */
  replied: number;
}

export interface GroupRow {
  key: string;
  sent: number;
  replied: number;
  interested: number;
}

export interface Stats {
  sent: number;
  sentLast7Days: number;
  delivered: number;
  replied: number;
  /** replied / delivered, 0..1 (null when nothing was delivered yet). */
  replyRate: number | null;
  interested: number;
  needsReview: number;
  followUpsDue: number;
  byStatus: Record<Status, number>;
  weekly: WeekPoint[];
  byRing: GroupRow[];
  bySegment: GroupRow[];
}

const isInterested = (o: Outreach) => o.outcome === "INTERESTED" || o.outcome === "MORE_INFO";

function groupBy(items: Outreach[], keyOf: (o: Outreach) => string): GroupRow[] {
  const rows = new Map<string, GroupRow>();
  for (const o of items) {
    const key = keyOf(o);
    const row = rows.get(key) ?? { key, sent: 0, replied: 0, interested: 0 };
    row.sent += 1;
    if (o.replyCount > 0) row.replied += 1;
    if (isInterested(o)) row.interested += 1;
    rows.set(key, row);
  }
  return [...rows.values()];
}

export function computeStats(items: Outreach[], now: Date, options: { weeks?: number; followUpDays?: number } = {}): Stats {
  const weeks = options.weeks ?? 12;
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const o of items) byStatus[deriveStatus(o, now, options.followUpDays)] += 1;

  const delivered = items.filter((o) => !o.bounced).length;
  const replied = items.filter((o) => o.replyCount > 0).length;

  const firstWeek = addDays(startOfWeek(now), -7 * (weeks - 1));
  const weekly: WeekPoint[] = Array.from({ length: weeks }, (_, i) => ({
    weekStart: addDays(firstWeek, 7 * i),
    sent: 0,
    replied: 0,
  }));
  for (const o of items) {
    const index = Math.round((startOfWeek(o.sentAt).getTime() - firstWeek.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const point = weekly[index];
    if (!point) continue;
    point.sent += 1;
    if (o.replyCount > 0) point.replied += 1;
  }

  const ringKey = (o: Outreach) => (o.company.ring == null ? "" : String(o.company.ring));
  const byRing = groupBy(items, ringKey).sort((a, b) => {
    if (a.key === "") return 1;
    if (b.key === "") return -1;
    return Number(a.key) - Number(b.key);
  });
  const bySegment = groupBy(items, (o) => o.company.segment ?? "").sort((a, b) => b.sent - a.sent);

  return {
    sent: items.length,
    sentLast7Days: items.filter((o) => o.sentAt >= addDays(now, -7)).length,
    delivered,
    replied,
    replyRate: delivered === 0 ? null : replied / delivered,
    interested: items.filter(isInterested).length,
    needsReview: byStatus.NEEDS_REVIEW,
    followUpsDue: byStatus.FOLLOW_UP_DUE,
    byStatus,
    weekly,
    byRing,
    bySegment,
  };
}
