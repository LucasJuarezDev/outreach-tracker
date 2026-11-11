import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LocaleSwitch } from "@/components/forms";
import { NavLinks } from "@/components/NavLinks";
import { getDictionary } from "@/i18n/server";
import { config } from "@/server/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outreach Tracker",
  description: "Track a cold-email prospecting campaign synced from Gmail: sends, replies, follow-ups and outcomes.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { locale, t } = await getDictionary();
  return (
    <html lang={locale}>
      <body className="min-h-screen font-sans antialiased">
        {config.demoMode && (
          <div className="bg-accent-soft px-4 py-1.5 text-center text-sm text-ink">{t.demoBanner}</div>
        )}
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <span className="flex items-center gap-2 font-semibold">
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="1" y="4" width="18" height="12" rx="2.5" fill="none" stroke="var(--accent)" strokeWidth="1.8" />
                <path d="M2 5.5l8 5.5 8-5.5" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
              {t.appName}
            </span>
            <NavLinks
              links={[
                { href: "/", label: t.nav.dashboard },
                { href: "/outreach", label: t.nav.outreach },
                { href: "/settings", label: t.nav.settings },
              ]}
            />
            <div className="ml-auto">
              <LocaleSwitch locale={locale} />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
