import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { CompanyForm, NotesForm, OutcomeSelect } from "@/components/forms";
import { StatusBadge } from "@/components/StatusBadge";
import { getDictionary } from "@/i18n/server";
import { formatDateTime, gmailThreadUrl } from "@/lib/format";
import { deriveStatus, followUpDueDate } from "@/lib/status";
import { config } from "@/server/config";
import { getRepository } from "@/server/repository";

export const dynamic = "force-dynamic";

export default async function OutreachDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { locale, t } = await getDictionary();
  const o = await getRepository().getOutreach(id);
  if (!o) notFound();

  const now = new Date();
  const status = deriveStatus(o, now, config.followUpDays);
  const due = followUpDueDate(o, config.followUpDays);
  const d = t.detail;
  const when = (date: Date) => formatDateTime(date, t.dateLocale);

  const timeline: Array<{ label: string; date: Date; detail?: string }> = [{ label: d.sent, date: o.sentAt, detail: o.subject }];
  if (o.followUpSentAt) timeline.push({ label: d.followUp, date: o.followUpSentAt });
  if (o.firstReplyAt) timeline.push({ label: d.firstReply, date: o.firstReplyAt });
  if (o.lastReplyAt && o.replyCount > 1) timeline.push({ label: d.lastReply, date: o.lastReplyAt });
  timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-6">
      <Link href="/outreach" className="text-sm text-accent hover:underline">
        ← {d.back}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{o.company.name}</h1>
          <p className="text-sm text-ink-2">
            {o.contact.name ? `${o.contact.name} · ` : ""}
            {o.contact.email}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge status={status} label={t.status[status]} />
          {!config.demoMode && (
            <a href={gmailThreadUrl(o.gmailThreadId)} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
              {d.openInGmail} ↗
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card title={d.timeline}>
            <ol className="space-y-3">
              {timeline.map((e) => (
                <li key={`${e.label}-${e.date.toISOString()}`} className="grid grid-cols-[10rem_1fr] gap-3 text-sm">
                  <span className="tabular text-ink-2">{when(e.date)}</span>
                  <span>
                    {e.label}
                    {e.detail && <span className="block text-ink-2">{e.detail}</span>}
                  </span>
                </li>
              ))}
              {due && (
                <li className="grid grid-cols-[10rem_1fr] gap-3 text-sm">
                  <span className="tabular text-ink-2">{when(due)}</span>
                  <span>{d.followUpDue}</span>
                </li>
              )}
            </ol>
            {(o.bounced || o.autoReplyCount > 0) && (
              <p className="mt-4 text-sm text-ink-2">{o.bounced ? d.bounced : d.autoReplies(o.autoReplyCount)}</p>
            )}
            {o.lastReplySnippet && (
              <blockquote className="mt-4 border-l-2 border-accent pl-3 text-sm text-ink-2">{o.lastReplySnippet}</blockquote>
            )}
          </Card>

          <Card title={d.outcome} subtitle={d.outcomeHint}>
            <div className="max-w-xs">
              <OutcomeSelect key={o.outcome} outreachId={o.id} value={o.outcome} locale={locale} />
            </div>
          </Card>

          <Card title={d.notes}>
            <NotesForm outreachId={o.id} value={o.notes} locale={locale} />
          </Card>
        </div>

        <Card title={d.companyTitle}>
          <CompanyForm company={o.company} locale={locale} />
        </Card>
      </div>
    </div>
  );
}
