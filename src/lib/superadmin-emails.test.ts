import { describe, expect, it, afterEach } from "vitest";
import { isSuperadminEmail } from "@/lib/superadmin-emails";

describe("isSuperadminEmail", () => {
  afterEach(() => {
    delete process.env.APP_SUPERADMIN_EMAILS;
  });

  it("matches built-in operations email case-insensitively", () => {
    expect(isSuperadminEmail("m.i.a.sciences@gmail.com")).toBe(true);
    expect(isSuperadminEmail("M.I.A.SCIENCES@gmail.com")).toBe(true);
    expect(isSuperadminEmail("apple.review@miascience.com")).toBe(true);
    expect(isSuperadminEmail("Apple.Review@MiaScience.com")).toBe(true);
  });

  it("matches additional emails from APP_SUPERADMIN_EMAILS", () => {
    process.env.APP_SUPERADMIN_EMAILS = " other@x.com , second@y.com ";
    expect(isSuperadminEmail("other@x.com")).toBe(true);
    expect(isSuperadminEmail("second@y.com")).toBe(true);
    expect(isSuperadminEmail("nope@x.com")).toBe(false);
  });

  it("returns false for empty or unknown", () => {
    expect(isSuperadminEmail("")).toBe(false);
    expect(isSuperadminEmail(null)).toBe(false);
    expect(isSuperadminEmail("user@gmail.com")).toBe(false);
  });
});
