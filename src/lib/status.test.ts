import { describe, expect, it } from "vitest";
import { deriveStatus, followUpDueDate } from "./status";
import { makeOutreach } from "./test-utils";

const sentAt = new Date("2026-11-02T13:00:00Z");
const day = (n: number) => new Date(sentAt.getTime() + n * 86_400_000);

describe("deriveStatus", () => {
  it("waits for a reply during the first week", () => {
    expect(deriveStatus(makeOutreach({ sentAt }), day(3))).toBe("AWAITING_REPLY");
  });

  it("asks for a follow-up after 7 days without a reply", () => {
    expect(deriveStatus(makeOutreach({ sentAt }), day(7))).toBe("FOLLOW_UP_DUE");
  });

  it("respects a custom follow-up window", () => {
    expect(deriveStatus(makeOutreach({ sentAt }), day(4), 5)).toBe("AWAITING_REPLY");
    expect(deriveStatus(makeOutreach({ sentAt }), day(5), 5)).toBe("FOLLOW_UP_DUE");
  });

  it("closes the thread a week after the single follow-up", () => {
    const o = makeOutreach({ sentAt, followUpSentAt: day(7) });
    expect(deriveStatus(o, day(10))).toBe("AWAITING_REPLY");
    expect(deriveStatus(o, day(14))).toBe("NO_RESPONSE");
  });

  it("flags an unclassified human reply for review", () => {
    expect(deriveStatus(makeOutreach({ sentAt, replyCount: 1 }), day(20))).toBe("NEEDS_REVIEW");
  });

  it("uses the user's outcome once it is set", () => {
    expect(deriveStatus(makeOutreach({ sentAt, replyCount: 1, outcome: "INTERESTED" }), day(1))).toBe("INTERESTED");
  });

  it("lets a bounce win over everything else", () => {
    expect(deriveStatus(makeOutreach({ sentAt, bounced: true, outcome: "LATER" }), day(1))).toBe("BOUNCED");
  });
});

describe("followUpDueDate", () => {
  it("is sentAt + 7 days while nothing happened", () => {
    expect(followUpDueDate(makeOutreach({ sentAt }))).toEqual(day(7));
  });

  it("is null after a reply, a bounce or a follow-up", () => {
    expect(followUpDueDate(makeOutreach({ sentAt, replyCount: 1 }))).toBeNull();
    expect(followUpDueDate(makeOutreach({ sentAt, bounced: true }))).toBeNull();
    expect(followUpDueDate(makeOutreach({ sentAt, followUpSentAt: day(7) }))).toBeNull();
  });
});
