import { describe, expect, it } from "vitest";
import { parseAddress, parseThread, type MessageLite } from "./gmail-parse";

const me = new Set(["lucas@exportai.me"]);
let n = 0;

function msg(at: string, headers: Record<string, string>, opts: { sent?: boolean; snippet?: string } = {}): MessageLite {
  n += 1;
  return {
    id: `m${n}`,
    internalDate: new Date(at).getTime(),
    labelIds: opts.sent ? ["SENT"] : ["INBOX"],
    headers,
    snippet: opts.snippet ?? "",
  };
}

const first = msg(
  "2026-11-02T13:00:00Z",
  { from: "Lucas <lucas@exportai.me>", to: '"Pérez, Ana" <Ana@RioSur.com.ar>', subject: "software para exportadores de carne" },
  { sent: true },
);

describe("parseAddress", () => {
  it("reads quoted display names", () => {
    expect(parseAddress('"Pérez, Ana" <Ana@RioSur.com.ar>')).toEqual({ name: "Pérez, Ana", email: "ana@riosur.com.ar" });
  });
  it("reads bare addresses and lists", () => {
    expect(parseAddress("a@x.com, b@y.com")).toEqual({ name: null, email: "a@x.com" });
  });
  it("returns null for garbage", () => {
    expect(parseAddress("undisclosed-recipients:;")).toBeNull();
  });
});

describe("parseThread", () => {
  it("reads the initial send", () => {
    const t = parseThread("t1", [first], me)!;
    expect(t.to).toEqual({ name: "Pérez, Ana", email: "ana@riosur.com.ar" });
    expect(t.subject).toBe("software para exportadores de carne");
    expect(t.sentAt.toISOString()).toBe("2026-11-02T13:00:00.000Z");
    expect(t.replyCount).toBe(0);
  });

  it("separates human replies, auto-replies and the follow-up", () => {
    const thread = [
      msg("2026-11-03T09:00:00Z", { from: "ana@riosur.com.ar", subject: "Respuesta automática: software", "auto-submitted": "auto-replied" }),
      msg("2026-11-09T13:00:00Z", { from: "lucas@exportai.me", subject: "Re: software" }, { sent: true }),
      msg("2026-11-10T11:00:00Z", { from: "Ana <ana@riosur.com.ar>", subject: "Re: software" }, { snippet: "Sí, mandame el video" }),
      first,
    ];
    const t = parseThread("t2", thread, me)!;
    expect(t.autoReplyCount).toBe(1);
    expect(t.followUpSentAt?.toISOString()).toBe("2026-11-09T13:00:00.000Z");
    expect(t.replyCount).toBe(1);
    expect(t.firstReplyAt?.toISOString()).toBe("2026-11-10T11:00:00.000Z");
    expect(t.lastReplySnippet).toBe("Sí, mandame el video");
  });

  it("detects bounces", () => {
    const bounce = msg("2026-11-02T13:01:00Z", { from: "Mail Delivery Subsystem <mailer-daemon@googlemail.com>", subject: "Delivery Status Notification (Failure)" });
    const t = parseThread("t3", [first, bounce], me)!;
    expect(t.bounced).toBe(true);
    expect(t.replyCount).toBe(0);
  });

  it("detects out-of-office replies by subject", () => {
    const ooo = msg("2026-11-02T14:00:00Z", { from: "ana@riosur.com.ar", subject: "Out of Office: software para exportadores" });
    expect(parseThread("t4", [first, ooo], me)!.autoReplyCount).toBe(1);
  });

  it("ignores threads that someone else started", () => {
    const inbound = msg("2026-11-01T10:00:00Z", { from: "ana@riosur.com.ar", to: "lucas@exportai.me", subject: "Hola" });
    expect(parseThread("t5", [inbound, first], me)).toBeNull();
  });
});
