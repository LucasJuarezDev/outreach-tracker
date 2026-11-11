import Link from "next/link";
import { Card, StatTile } from "@/components/Card";
import { GroupTable } from "@/components/GroupTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusBars } from "@/components/StatusBars";
import { WeeklyChart } from "@/components/WeeklyChart";
import { getDictionary } from "@/i18n/server";
import { formatDate, formatPercent } from "@/lib/format";
import { computeStats } from "@/lib/stats";
import { ACTION_STATUSES, deriveStatus } from "@/lib/status";
import { STATUSES } from "@/lib/types";
import { config } from "@/server/config";
import { getRepository } from "@/server/repository";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { locale, t } = await getDictionary();
  const items = await getRepository().listOutreaches();
  const now = new Date();

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-medium">{t.dashboard.empty}</p>
        <Link href="/settings" className="mt-2 inline-block text-accent hover:underline">
          {t.dashboard.emptyCta}
        </Link>
      </div>
    );
  }

  const stats = computeStats(items, now, { followUpDays: config.followUpDays });
  const d = t.dashboard;
  const attention = items
    .map((o) => ({ o, status: deriveStatus(o, now, config.followUpDays) }))
    .filter(({ status }) => ACTION_STATUSES.includes(status))
    .sort((a, b) => (a.status === b.status ? a.o.sentAt.getTime() - b.o.sentAt.getTime() : a.status === "NEEDS_REVIEW" ? -1 : 1));
  const columns = { sent: d.colSent, replied: d.colReplied, rate: d.colRate, interested: d.colInterested };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{d.title}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={d.sent} value={String(stats.sent)} hint={d.sentDelta(stats.sentLast7Days)} />
        <StatTile
          label={d.replyRate}
          value={formatPercent(stats.replyRate, t.dateLocale)}
          hint={d.replyRateHint(stats.replied, stats.delivered)}
        />
        <StatTile label={d.interested} value={String(stats.interested)} hint={d.interestedHint} />
        <StatTile
          label={d.attention}
          value={String(stats.needsReview + stats.followUpsDue)}
          hint={d.attentionHint(stats.needsReview, stats.followUpsDue)}
        />
      </div>

      <Card title={d.weeklyTitle} subtitle={d.weeklySubtitle}>
        <WeeklyChart
          locale={locale}
          data={stats.weekly.map((w) => ({ weekStart: w.weekStart.toISOString(), sent: w.sent, replied: w.replied }))}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={d.attentionTitle}>
          {attention.length === 0 ? (
            <p className="text-sm text-muted">{d.attentionEmpty}</p>
          ) : (
            <ul className="divide-y divide-line">
              {attention.slice(0, 8).map(({ o, status }) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <Link href={`/outreach/${o.id}`} className="font-medium hover:underline">
                      {o.company.name}
                    </Link>
                    <p className="truncate text-xs text-muted">
                      {formatDate(o.sentAt, t.dateLocale)} · {o.contact.name ?? o.contact.email}
                    </p>
                  </div>
                  <StatusBadge status={status} label={t.status[status]} />
                </li>
              ))}
            </ul>
          )}
          {attention.length > 8 && (
            <Link href="/outreach" className="mt-3 inline-block text-sm text-accent hover:underline">
              +{attention.length - 8}
            </Link>
          )}
        </Card>

        <Card title={d.statusTitle}>
          <StatusBars
            total={stats.sent}
            rows={STATUSES.map((s) => ({ status: s, label: t.status[s], count: stats.byStatus[s] }))}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={d.ringTitle}>
          <GroupTable rows={stats.byRing} labelOf={d.ring} columns={{ group: t.detail.ring, ...columns }} dateLocale={t.dateLocale} />
        </Card>
        <Card title={d.segmentTitle}>
          <GroupTable
            rows={stats.bySegment}
            labelOf={(k) => k || d.noSegment}
            columns={{ group: t.detail.segment, ...columns }}
            dateLocale={t.dateLocale}
          />
        </Card>
      </div>
    </div>
  );
}
