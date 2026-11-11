"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { LOCALES } from "@/i18n/dictionaries";
import { LOCALE_COOKIE } from "@/i18n/server";
import { OUTCOMES } from "@/lib/types";
import { config } from "@/server/config";
import { getPrisma } from "@/server/db";
import { syncGmail, type SyncResult } from "@/server/gmail/sync";
import { getRepository } from "@/server/repository";

const id = z.string().min(1).max(64);
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => v.trim() || null)
    .nullable();

export async function setOutcomeAction(outreachId: string, outcome: string) {
  await getRepository().setOutcome(id.parse(outreachId), z.enum(OUTCOMES).parse(outcome));
  revalidatePath("/", "layout");
}

export async function setNotesAction(outreachId: string, notes: string) {
  await getRepository().setNotes(id.parse(outreachId), optionalText(5000).parse(notes));
  revalidatePath("/", "layout");
}

const companySchema = z.object({
  name: z.string().trim().min(1).max(200),
  website: optionalText(300),
  location: optionalText(200),
  ring: z.coerce.number().int().min(1).max(9).nullable(),
  segment: optionalText(100),
  notes: optionalText(5000),
});

export async function updateCompanyAction(companyId: string, input: z.input<typeof companySchema>) {
  await getRepository().updateCompany(id.parse(companyId), companySchema.parse(input));
  revalidatePath("/", "layout");
}

export type SyncActionResult = { ok: true; result: SyncResult } | { ok: false; error: string };

export async function syncAction(): Promise<SyncActionResult> {
  if (config.demoMode) return { ok: false, error: "Demo mode: Gmail sync is disabled." };
  try {
    const result = await syncGmail();
    revalidatePath("/", "layout");
    return { ok: true, result };
  } catch (error) {
    console.error("Gmail sync failed", error);
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function disconnectGmailAction() {
  if (config.demoMode) return;
  await getPrisma().gmailAccount.deleteMany();
  revalidatePath("/settings");
}

export async function setLocaleAction(locale: string) {
  const value = z.enum(LOCALES).parse(locale);
  (await cookies()).set(LOCALE_COOKIE, value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
