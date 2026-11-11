import { StatusBadge } from "./StatusBadge";
import type { Status } from "@/lib/types";

/** One measure across statuses: single-hue horizontal bars, value at the tip, in lifecycle order. */
export function StatusBars({ rows, total }: { rows: Array<{ status: Status; label: string; count: number }>; total: number }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const share = total ? Math.round((r.count / total) * 100) : 0;
        return (
          <li key={r.status} className="grid grid-cols-[11rem_1fr] items-center gap-3" title={`${r.label}: ${r.count} (${share}%)`}>
            <StatusBadge status={r.status} label={r.label} />
            <div className="flex items-center gap-2">
              {r.count > 0 && (
                // Longest bar takes 85% of the track, leaving room for the value at its tip.
                <span className="block h-3 shrink-0 rounded-r bg-series-1" style={{ width: `${(r.count / max) * 85}%`, minWidth: 3 }} />
              )}
              <span className="tabular text-sm text-ink-2">{r.count}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
