"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { dictionaries, type Locale } from "@/i18n/dictionaries";
import { formatDate } from "@/lib/format";
import { STATUSES, type Status } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export interface OutreachRow {
  id: string;
  company: string;
  location: string | null;
  ring: number | null;
  contactName: string | null;
  contactEmail: string;
  subject: string;
  sentAt: string;
  status: Status;
  lastReplyAt: string | null;
}

const inputClass = "rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted";
const PAGE_SIZE = 50;

export function OutreachTable({ rows, locale, initialStatus }: { rows: OutreachRow[]; locale: Locale; initialStatus?: Status }) {
  const dict = dictionaries[locale];
  const t = dict.outreach;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "">(initialStatus ?? "");
  const [ring, setRing] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const rings = useMemo(() => [...new Set(rows.map((r) => r.ring).filter((r): r is number => r != null))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!status || r.status === status) &&
        (!ring || String(r.ring) === ring) &&
        (!q || [r.company, r.contactName ?? "", r.contactEmail, r.subject].some((v) => v.toLowerCase().includes(q))),
    );
  }, [rows, query, status, ring]);
  const visible = filtered.slice(0, limit);
  const remaining = filtered.length - visible.length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          className={`${inputClass} w-full sm:w-72`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as Status | "")} aria-label={t.status} className={inputClass}>
          <option value="">{t.allStatuses}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {dict.status[s]}
            </option>
          ))}
        </select>
        <select value={ring} onChange={(e) => setRing(e.target.value)} aria-label={dict.detail.ring} className={inputClass}>
          <option value="">{t.allRings}</option>
          {rings.map((r) => (
            <option key={r} value={String(r)}>
              {dict.dashboard.ring(String(r))}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted sm:ml-auto">{t.count(filtered.length, rows.length)}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-ink-2">
            <tr className="border-b border-line">
              <th className="px-4 py-2.5 font-medium">{t.company}</th>
              <th className="px-4 py-2.5 font-medium">{t.contact}</th>
              <th className="px-4 py-2.5 font-medium">{t.subject}</th>
              <th className="px-4 py-2.5 font-medium">{t.sentAt}</th>
              <th className="px-4 py-2.5 font-medium">{t.status}</th>
              <th className="px-4 py-2.5 font-medium">{t.lastReply}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-t border-line first:border-t-0 hover:bg-surface-2">
                <td className="px-4 py-2.5">
                  <Link href={`/outreach/${r.id}`} className="font-medium hover:underline">
                    {r.company}
                  </Link>
                  {(r.location || r.ring) && (
                    <p className="text-xs text-muted">
                      {[r.location, r.ring ? dict.dashboard.ring(String(r.ring)) : null].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <p>{r.contactName ?? r.contactEmail}</p>
                  {r.contactName && <p className="text-xs text-muted">{r.contactEmail}</p>}
                </td>
                <td className="max-w-64 truncate px-4 py-2.5 text-ink-2" title={r.subject}>
                  {r.subject}
                </td>
                <td className="tabular whitespace-nowrap px-4 py-2.5 text-ink-2">{formatDate(new Date(r.sentAt), dict.dateLocale)}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={r.status} label={dict.status[r.status]} />
                </td>
                <td className="tabular whitespace-nowrap px-4 py-2.5 text-ink-2">
                  {r.lastReplyAt ? formatDate(new Date(r.lastReplyAt), dict.dateLocale) : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">{t.noResults}</p>}
      </div>
      {remaining > 0 && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium hover:bg-surface-2"
          >
            {t.showMore(Math.min(PAGE_SIZE, remaining))}
          </button>
        </div>
      )}
    </div>
  );
}
