import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { config } from "@/server/config";
import { buildConsentUrl, OAUTH_STATE_COOKIE } from "@/server/gmail/oauth";

export async function GET(request: Request) {
  if (config.demoMode || !config.google) {
    return NextResponse.redirect(new URL("/settings", request.url));
  }
  const state = randomBytes(24).toString("hex");
  const response = NextResponse.redirect(buildConsentUrl(state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/api/gmail",
    maxAge: 10 * 60,
  });
  return response;
}
