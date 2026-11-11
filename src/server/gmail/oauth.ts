import "server-only";
import { auth } from "@googleapis/gmail";
import { config } from "../config";

export const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

/** Cookie holding the OAuth `state` value between /connect and /callback (CSRF protection). */
export const OAUTH_STATE_COOKIE = "gmail_oauth_state";

export class GmailNotConfiguredError extends Error {
  constructor() {
    super("Google OAuth credentials are missing (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).");
  }
}

export function createOAuthClient() {
  if (!config.google) throw new GmailNotConfiguredError();
  return new auth.OAuth2(config.google.clientId, config.google.clientSecret, config.google.redirectUri);
}

export function buildConsentUrl(state: string): string {
  return createOAuthClient().generateAuthUrl({
    access_type: "offline",
    // Always ask, so Google returns a refresh token even on reconnect.
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state,
  });
}
