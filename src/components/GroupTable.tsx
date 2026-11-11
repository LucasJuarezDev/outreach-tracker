import { formatPercent } from "@/lib/format";
import type { GroupRow } from "@/lib/stats";

export function GroupTable({ rows, labelOf, columns, dateLocale }: {
  rows: GroupRow[];
  labelOf: (key: string) => string;
  columns: { group: string; sent: string; replied: string; rate: string; interested: string };
  dateLocale: string;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-ink-2">
        <tr>
          <th className="py-1.5 font-medium">{columns.group}</th>
          <th className="py-1.5 text-right font-medium">{columns.sent}</th>
          <th className="py-1.5 text-right font-medium">{columns.replied}</th>
          <th className="py-1.5 text-right font-medium">{columns.rate}</th>
          <th className="py-1.5 text-right font-medium">{columns.interested}</th>
        </tr>
      </thead>
      <tbody className="tabular">
        {rows.map((r) => (
          <tr key={r.key} className="border-t border-line">
            <td className="py-1.5">{labelOf(r.key)}</td>
            <td className="py-1.5 text-right">{r.sent}</td>
            <td className="py-1.5 text-right">{r.replied}</td>
            <td className="py-1.5 text-right">{formatPercent(r.sent ? r.replied / r.sent : null, dateLocale)}</td>
            <td className="py-1.5 text-right">{r.interested}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
