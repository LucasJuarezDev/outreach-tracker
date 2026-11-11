import { describe, expect, it } from "vitest";
import { computeStats } from "./stats";
import { makeOutreach } from "./test-utils";

const now = new Date("2026-11-11T15:00:00Z"); // Wednesday

describe("computeStats", () => {
  const company = (ring: number | null, segment: string | null) => ({
    id: "x",
    name: "X",
    domain: "x.example",
    website: null,
    location: null,
    ring,
    segment,
    notes: null,
  });

  const items = [
    makeOutreach({ sentAt: new Date("2026-11-10T13:00:00Z"), company: company(1, "Beef") }),
    makeOutreach({ sentAt: new Date("2026-11-03T13:00:00Z"), replyCount: 1, outcome: "INTERESTED", company: company(1, "Beef") }),
    makeOutreach({ sentAt: new Date("2026-11-03T14:00:00Z"), replyCount: 1, company: company(2, "Seafood") }),
    makeOutreach({ sentAt: new Date("2026-10-27T13:00:00Z"), bounced: true, company: company(null, null) }),
  ];
  const stats = computeStats(items, now, { weeks: 4 });

  it("counts sends, deliveries and replies", () => {
    expect(stats.sent).toBe(4);
    expect(stats.sentLast7Days).toBe(1);
    expect(stats.delivered).toBe(3);
    expect(stats.replied).toBe(2);
    expect(stats.replyRate).toBeCloseTo(2 / 3);
    expect(stats.interested).toBe(1);
    expect(stats.needsReview).toBe(1);
  });

  it("buckets sends into Monday-based weeks, oldest first", () => {
    expect(stats.weekly.map((w) => w.weekStart.toISOString().slice(0, 10))).toEqual([
      "2026-10-19",
      "2026-10-26",
      "2026-11-02",
      "2026-11-09",
    ]);
    expect(stats.weekly.map((w) => [w.sent, w.replied])).toEqual([
      [0, 0],
      [1, 0],
      [2, 2],
      [1, 0],
    ]);
  });

  it("groups by ring with the unassigned ring last", () => {
    expect(stats.byRing.map((r) => [r.key, r.sent, r.replied, r.interested])).toEqual([
      ["1", 2, 1, 1],
      ["2", 1, 1, 0],
      ["", 1, 0, 0],
    ]);
  });

  it("has no reply rate before anything is delivered", () => {
    expect(computeStats([], now).replyRate).toBeNull();
  });
});
