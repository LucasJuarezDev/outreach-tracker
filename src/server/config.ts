import "server-only";
import { z } from "zod";

const schema = z.object({
  DEMO_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().default("http://localhost:3000/api/gmail/callback"),
  GMAIL_QUERY: z.string().min(1).default("in:sent label:prospeccion"),
  FOLLOW_UP_DAYS: z.coerce.number().int().min(1).max(60).default(7),
  DEFAULT_LOCALE: z.enum(["es", "en"]).default("es"),
});

const parsed = schema.parse({
  ...process.env,
  // Treat empty strings from .env as "not set".
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || undefined,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || undefined,
});

export const config = {
  demoMode: parsed.DEMO_MODE,
  google:
    parsed.GOOGLE_CLIENT_ID && parsed.GOOGLE_CLIENT_SECRET
      ? { clientId: parsed.GOOGLE_CLIENT_ID, clientSecret: parsed.GOOGLE_CLIENT_SECRET, redirectUri: parsed.GOOGLE_REDIRECT_URI }
      : null,
  gmailQuery: parsed.GMAIL_QUERY,
  followUpDays: parsed.FOLLOW_UP_DAYS,
  defaultLocale: parsed.DEFAULT_LOCALE,
} as const;
