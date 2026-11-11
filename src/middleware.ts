import { NextResponse, type NextRequest } from "next/server";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** "localhost:3000" → "localhost", "[::1]:3000" → "[::1]" */
export function hostnameOf(hostHeader: string | null): string {
  if (!hostHeader) return "";
  const host = hostHeader.trim().toLowerCase();
  if (host.startsWith("[")) return host.slice(0, host.indexOf("]") + 1);
  return host.split(":")[0] ?? "";
}

/**
 * The real mode has no login: it is meant to run only on your own machine.
 * Outside demo mode, refuse any request whose Host header is not a local host
 * (also blocks DNS-rebinding attempts from a malicious page).
 */
export function middleware(request: NextRequest) {
  if (process.env.DEMO_MODE === "true") return NextResponse.next();
  if (LOCAL_HOSTS.has(hostnameOf(request.headers.get("host")))) return NextResponse.next();
  return new NextResponse("This instance only serves localhost. Set DEMO_MODE=true for a public demo.", { status: 403 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
