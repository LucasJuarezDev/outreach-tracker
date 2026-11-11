"use client";

import { useState } from "react";
import { dictionaries, type Locale } from "@/i18n/dictionaries";
import { formatWeek } from "@/lib/format";

export interface WeeklyDatum {
  weekStart: string; // ISO date
  sent: number;
  replied: number;
}

const HEIGHT = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 32 };
const BAR = 14;
const GAP = 2;

function niceMax(value: number): number {
  if (value <= 5) return 5;
  const step = value <= 20 ? 5 : value <= 50 ? 10 : 25;
  return Math.ceil(value / step) * step;
}

/** Grouped columns (sent vs. got a reply) per week, with hover tooltip and a table view. */
export function WeeklyChart({ data, locale }: { data: WeeklyDatum[]; locale: Locale }) {
  const t = dictionaries[locale].dashboard;
  const dateLocale = dictionaries[locale].dateLocale;
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);

  const width = 720;
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(1, ...data.map((d) => d.sent)));
  const ticks = [0, max / 2, max];
  const band = plotW / Math.max(1, data.length);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const label = (iso: string) => formatWeek(new Date(iso), dateLocale);

  /** Column with a 4px rounded top and a square base. */
  const column = (x: number, value: number) => {
    const top = y(value);
    const h = PAD.top + plotH - top;
    if (h <= 0) return "";
    const r = Math.min(4, h, BAR / 2);
    return `M${x},${top + h}V${top + r}Q${x},${top} ${x + r},${top}H${x + BAR - r}Q${x + BAR},${top} ${x + BAR},${top + r}V${top + h}Z`;
  };

  const active = hover == null ? null : data[hover];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex gap-4 text-sm text-ink-2" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-series-1" /> {t.sentSeries}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-series-2" /> {t.repliedSeries}
          </li>
        </ul>
        <button type="button" onClick={() => setAsTable((v) => !v)} className="text-sm text-accent hover:underline">
          {asTable ? t.showChart : t.showTable}
        </button>
      </div>

      {asTable ? (
        <table className="w-full text-sm">
          <thead className="text-left text-ink-2">
            <tr>
              <th className="py-1.5 font-medium">{t.weekOf}</th>
              <th className="py-1.5 text-right font-medium">{t.sentSeries}</th>
              <th className="py-1.5 text-right font-medium">{t.repliedSeries}</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {data.map((d) => (
              <tr key={d.weekStart} className="border-t border-line">
                <td className="py-1.5">{label(d.weekStart)}</td>
                <td className="py-1.5 text-right">{d.sent}</td>
                <td className="py-1.5 text-right">{d.replied}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${HEIGHT}`}
            className="h-auto w-full"
            role="img"
            aria-label={`${t.weeklyTitle}. ${data.map((d) => `${label(d.weekStart)}: ${d.sent} / ${d.replied}`).join("; ")}`}
            onMouseLeave={() => setHover(null)}
          >
            {ticks.map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke={v === 0 ? "var(--axis)" : "var(--grid)"} strokeWidth={1} />
                <text x={PAD.left - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--muted)" className="tabular">
                  {v}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const cx = PAD.left + band * i + band / 2;
              const x1 = cx - BAR - GAP / 2;
              const x2 = cx + GAP / 2;
              const showLabel = data.length <= 8 || i % 2 === data.length % 2 || i === data.length - 1;
              return (
                <g key={d.weekStart} onMouseEnter={() => setHover(i)}>
                  {hover === i && <rect x={cx - band / 2} y={PAD.top} width={band} height={plotH} fill="var(--surface-2)" />}
                  <path d={column(x1, d.sent)} fill="var(--series-1)" />
                  <path d={column(x2, d.replied)} fill="var(--series-2)" />
                  {showLabel && (
                    <text x={cx} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
                      {label(d.weekStart)}
                    </text>
                  )}
                  {/* Hit target: the whole band, larger than the marks. */}
                  <rect x={cx - band / 2} y={PAD.top} width={band} height={plotH + PAD.bottom} fill="transparent" />
                </g>
              );
            })}
          </svg>
          {active && hover != null && (
            <div
              className="pointer-events-none absolute top-0 z-10 rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-sm"
              style={{
                left: `${((PAD.left + band * hover + band / 2) / width) * 100}%`,
                transform: hover > data.length / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
              }}
            >
              <p className="mb-1 font-medium">
                {t.weekOf} {label(active.weekStart)}
              </p>
              <p className="flex items-center gap-1.5 text-ink-2">
                <span className="inline-block h-2 w-2 rounded-sm bg-series-1" /> {t.sentSeries}: <span className="tabular text-ink">{active.sent}</span>
              </p>
              <p className="flex items-center gap-1.5 text-ink-2">
                <span className="inline-block h-2 w-2 rounded-sm bg-series-2" /> {t.repliedSeries}: <span className="tabular text-ink">{active.replied}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
