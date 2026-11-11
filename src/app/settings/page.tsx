import { Card } from "@/components/Card";
import { DisconnectButton, SyncButton } from "@/components/forms";
import { getDictionary } from "@/i18n/server";
import { formatDateTime } from "@/lib/format";
import { config } from "@/server/config";
import { getRepository } from "@/server/repository";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ gmail?: string }> }) {
  const { locale, t } = await getDictionary();
  const s = t.settings;
  const { gmail: message } = await searchParams;
  const connection = await getRepository().getGmailConnection();
  const notice = message ? s.messages[message] : undefined;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">{s.title}</h1>
      {notice && (
        <p className={`rounded-lg border border-line bg-surface px-4 py-3 text-sm ${message === "connected" ? "text-good-text" : "text-critical"}`}>
          {notice}
        </p>
      )}

      <Card>
        {config.demoMode ? (
          <p className="text-sm text-ink-2">{s.demo}</p>
        ) : !config.google ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{s.notConfigured}</p>
            <p className="text-ink-2">{s.notConfiguredSteps}</p>
          </div>
        ) : !connection ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-2">{s.notConnected}</p>
            <a href="/api/gmail/connect" className="inline-block rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:opacity-90">
              {s.connect}
            </a>
          </div>
        ) : (
          <div className="space-y-5">
            <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
              <dt className="text-ink-2">{s.connectedAs}</dt>
              <dd className="font-medium">{connection.email}</dd>
              <dt className="text-ink-2">{s.lastSync}</dt>
              <dd>{connection.lastSyncAt ? formatDateTime(connection.lastSyncAt, t.dateLocale) : s.never}</dd>
              <dt className="text-ink-2">{s.query}</dt>
              <dd>
                <code className="rounded bg-surface-2 px-1.5 py-0.5">{config.gmailQuery}</code>
                <p className="mt-1 text-xs text-muted">{s.queryHint}</p>
              </dd>
            </dl>
            <div className="flex flex-wrap items-center gap-3">
              <SyncButton locale={locale} />
              <DisconnectButton locale={locale} />
            </div>
          </div>
        )}
        <p className="mt-5 border-t border-line pt-4 text-xs text-muted">{s.readOnly}</p>
      </Card>
    </div>
  );
}
