/** Dates are shown in the campaign's time zone, whatever the server's is. */
export const TIME_ZONE = "America/Argentina/Buenos_Aires";

export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: TIME_ZONE }).format(date);
}

/** Week buckets are UTC Mondays; format them in UTC so they never shift to Sunday. */
export function formatWeek(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

export function formatDateTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatPercent(ratio: number | null, locale: string): string {
  if (ratio == null) return "–";
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(ratio);
}

export function gmailThreadUrl(threadId: string): string {
  return `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(threadId)}`;
}
