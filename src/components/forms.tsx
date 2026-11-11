"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { disconnectGmailAction, setLocaleAction, setNotesAction, setOutcomeAction, syncAction, updateCompanyAction } from "@/app/actions";
import { dictionaries, type Locale } from "@/i18n/dictionaries";
import { OUTCOMES, type Company, type Outcome } from "@/lib/types";

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted disabled:opacity-60";
const buttonClass =
  "rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass = "rounded-lg border border-line px-3.5 py-2 text-sm font-medium hover:bg-surface-2 disabled:opacity-60";

function useSaveState() {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      setSaved(false);
      await fn();
      setSaved(true);
    });
  return { pending, saved, run, reset: () => setSaved(false) };
}

export function OutcomeSelect({ outreachId, value, locale }: { outreachId: string; value: Outcome; locale: Locale }) {
  const dict = dictionaries[locale];
  const { pending, run } = useSaveState();
  return (
    <select
      defaultValue={value}
      disabled={pending}
      aria-label={dict.detail.outcome}
      onChange={(e) => {
        const next = e.target.value;
        run(() => setOutcomeAction(outreachId, next));
      }}
      className={inputClass}
    >
      {OUTCOMES.map((o) => (
        <option key={o} value={o}>
          {dict.outcome[o]}
        </option>
      ))}
    </select>
  );
}

export function NotesForm({ outreachId, value, locale }: { outreachId: string; value: string | null; locale: Locale }) {
  const t = dictionaries[locale].detail;
  const [notes, setNotes] = useState(value ?? "");
  const { pending, saved, run, reset } = useSaveState();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => setNotesAction(outreachId, notes));
      }}
      className="space-y-2"
    >
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          reset();
        }}
        rows={4}
        placeholder={t.notesPlaceholder}
        aria-label={t.notes}
        className={inputClass}
      />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? t.saving : t.save}
        </button>
        {saved && <span className="text-sm text-good-text">{t.saved}</span>}
      </div>
    </form>
  );
}

export function CompanyForm({ company, locale }: { company: Company; locale: Locale }) {
  const t = dictionaries[locale].detail;
  const { pending, saved, run, reset } = useSaveState();
  const field = (name: keyof Company, label: string, type = "text") => (
    <label className="block space-y-1">
      <span className="text-sm text-ink-2">{label}</span>
      <input name={name} type={type} defaultValue={company[name] == null ? "" : String(company[name])} className={inputClass} />
    </label>
  );
  return (
    <form
      onChange={reset}
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const text = (k: string) => String(form.get(k) ?? "");
        const ring = text("ring").trim();
        run(() =>
          updateCompanyAction(company.id, {
            name: text("name"),
            website: text("website"),
            location: text("location"),
            ring: ring ? Number(ring) : null,
            segment: text("segment"),
            notes: text("notes"),
          }),
        );
      }}
      className="space-y-3"
    >
      {field("name", t.name)}
      {field("website", t.website, "url")}
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        {field("location", t.location)}
        <label className="block space-y-1">
          <span className="text-sm text-ink-2">{t.ring}</span>
          <input name="ring" type="number" min={1} max={9} defaultValue={company.ring ?? ""} className={inputClass} />
        </label>
      </div>
      {field("segment", t.segment)}
      <label className="block space-y-1">
        <span className="text-sm text-ink-2">{t.companyNotes}</span>
        <textarea name="notes" rows={3} defaultValue={company.notes ?? ""} className={inputClass} />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? t.saving : t.save}
        </button>
        {saved && <span className="text-sm text-good-text">{t.saved}</span>}
      </div>
    </form>
  );
}

export function SyncButton({ locale, disabled }: { locale: Locale; disabled?: boolean }) {
  const t = dictionaries[locale].settings;
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending || disabled}
        className={buttonClass}
        onClick={() =>
          startTransition(async () => {
            const res = await syncAction();
            setMessage(
              res.ok
                ? { ok: true, text: t.syncResult(res.result.threads, res.result.created, res.result.updated) }
                : { ok: false, text: res.error },
            );
          })
        }
      >
        {pending ? t.syncing : t.syncNow}
      </button>
      {message && <span className={`text-sm ${message.ok ? "text-good-text" : "text-critical"}`}>{message.text}</span>}
    </div>
  );
}

export function DisconnectButton({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].settings;
  const [pending, startTransition] = useTransition();
  return (
    <button type="button" disabled={pending} className={secondaryButtonClass} onClick={() => startTransition(() => disconnectGmailAction())}>
      {t.disconnect}
    </button>
  );
}

export function LocaleSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const label = dictionaries[locale].language;
  return (
    <div role="group" aria-label={label} className="flex rounded-lg border border-line p-0.5 text-xs">
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          aria-pressed={l === locale}
          onClick={() =>
            startTransition(async () => {
              await setLocaleAction(l);
              router.refresh();
            })
          }
          className={`rounded-md px-2 py-1 font-medium uppercase ${l === locale ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
