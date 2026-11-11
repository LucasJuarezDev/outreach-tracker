import { timingSafeEqual } from "node:crypto";
import { gmail } from "@googleapis/gmail";
import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/server/config";
import { getPrisma } from "@/server/db";
import { createOAuthClient, OAUTH_STATE_COOKIE } from "@/server/gmail/oauth";

function sameState(a: string | undefined, b: string | null): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  const settings = new URL("/settings", request.url);
  const fail = (reason: string) => {
    settings.searchParams.set("gmail", reason);
    const res = NextResponse.redirect(settings);
    res.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/api/gmail" });
    return res;
  };

  if (config.demoMode || !config.google) return fail("not-configured");

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return fail("denied");
  if (!sameState(request.cookies.get(OAUTH_STATE_COOKIE)?.value, params.get("state"))) return fail("state");
  const code = params.get("code");
  if (!code) return fail("denied");

  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) return fail("no-refresh-token");
  client.setCredentials(tokens);

  const profile = await gmail({ version: "v1", auth: client }).users.getProfile({ userId: "me" });
  const email = profile.data.emailAddress;
  if (!email) return fail("denied");

  await getPrisma().gmailAccount.upsert({
    where: { id: 1 },
    create: { id: 1, email, refreshToken: tokens.refresh_token },
    update: { email, refreshToken: tokens.refresh_token },
  });

  return fail("connected");
}
