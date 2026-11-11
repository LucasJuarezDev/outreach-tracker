import { describe, expect, it } from "vitest";
import { companyFromEmail, nameFromDomain } from "./company";

describe("nameFromDomain", () => {
  it.each([
    ["lpartners.net", "Lpartners"],
    ["www.rio-sur.com.ar", "Rio Sur"],
    ["ventas.pampa.com.br", "Pampa"],
    ["acme.co.uk", "Acme"],
    ["delta_foods.io", "Delta Foods"],
  ])("%s → %s", (domain, expected) => {
    expect(nameFromDomain(domain)).toBe(expected);
  });
});

describe("companyFromEmail", () => {
  it("groups corporate addresses by domain", () => {
    expect(companyFromEmail("Ana@RioSur.com.ar")).toEqual({ domain: "riosur.com.ar", name: "Riosur" });
  });

  it("keeps free-provider addresses as individual prospects", () => {
    expect(companyFromEmail("juan.perez@gmail.com", "Juan Pérez")).toEqual({
      domain: "personal:juan.perez@gmail.com",
      name: "Juan Pérez",
    });
  });
});
