import { describe, expect, it } from "vitest";
import { hostnameOf } from "./middleware";

describe("hostnameOf", () => {
  it.each([
    ["localhost:3000", "localhost"],
    ["127.0.0.1:3000", "127.0.0.1"],
    ["[::1]:3000", "[::1]"],
    ["LOCALHOST", "localhost"],
    ["evil.example.com", "evil.example.com"],
    ["localhost.evil.com:3000", "localhost.evil.com"],
    [null, ""],
  ])("%s → %s", (input, expected) => {
    expect(hostnameOf(input)).toBe(expected);
  });
});
