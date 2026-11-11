import { STATUS_TONE, type StatusTone } from "@/lib/status";
import type { Status } from "@/lib/types";

// Text always wears ink tokens; only the icon carries the status color.
const TONE_CLASS: Record<StatusTone, string> = {
  good: "text-ink",
  warning: "text-ink",
  critical: "text-ink",
  accent: "text-ink",
  neutral: "text-ink-2",
  muted: "text-ink-2",
};

const ICON_COLOR: Record<StatusTone, string> = {
  good: "var(--good)",
  warning: "var(--warning)",
  critical: "var(--critical)",
  accent: "var(--accent)",
  neutral: "var(--ink-2)",
  muted: "var(--muted)",
};

/** Status colors never carry meaning alone: each tone has its own icon shape plus the label. */
function ToneIcon({ tone }: { tone: StatusTone }) {
  const color = ICON_COLOR[tone];
  const common = { width: 14, height: 14, viewBox: "0 0 16 16", "aria-hidden": true } as const;
  switch (tone) {
    case "good":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="7" fill={color} />
          <path d="M4.8 8.2l2.1 2.1 4.3-4.6" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "warning":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="7" fill={color} />
          <path d="M8 4.5V8.3l2.4 1.5" stroke="#0b0b0b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "critical":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="7" fill={color} />
          <path d="M5.5 5.5l5 5m0-5l-5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "accent":
      return (
        <svg {...common}>
          <path d="M2 4.5A2.5 2.5 0 014.5 2h7A2.5 2.5 0 0114 4.5v4A2.5 2.5 0 0111.5 11H7l-3.5 3v-3h0A2.5 2.5 0 012 8.5z" fill={color} />
        </svg>
      );
    case "neutral":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.8" fill="none" />
        </svg>
      );
    case "muted":
      return (
        <svg {...common}>
          <path d="M4 8h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  const tone = STATUS_TONE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm ${TONE_CLASS[tone]}`}>
      <ToneIcon tone={tone} />
      {label}
    </span>
  );
}
