import { OutreachTable } from "@/components/OutreachTable";
import { getDictionary } from "@/i18n/server";
import { deriveStatus } from "@/lib/status";
import { STATUSES, type Status } from "@/lib/types";
import { config } from "@/server/config";
import { getRepository } from "@/server/repository";

export const dynamic = "force-dynamic";

export default async function OutreachPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { locale, t } = await getDictionary();
  const items = await getRepository().listOutreaches();
  const now = new Date();
  const { status } = await searchParams;
  const initialStatus = (STATUSES as readonly string[]).includes(status ?? "") ? (status as Status) : undefined;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t.outreach.title}</h1>
      <OutreachTable
        locale={locale}
        initialStatus={initialStatus}
        rows={items.map((o) => ({
          id: o.id,
          company: o.company.name,
          location: o.company.location,
          ring: o.company.ring,
          contactName: o.contact.name,
          contactEmail: o.contact.email,
          subject: o.subject,
          sentAt: o.sentAt.toISOString(),
          status: deriveStatus(o, now, config.followUpDays),
          lastReplyAt: o.lastReplyAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
