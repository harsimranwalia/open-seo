import { describe, expect, it } from "vitest";
import {
  isTelemetryOptOutValue,
  looksLikeDataForSeoKey,
} from "@/shared/selfhost-checks";

describe("looksLikeDataForSeoKey", () => {
  it("accepts base64(login:password)", () => {
    expect(looksLikeDataForSeoKey(btoa("user:pass"))).toBe(true);
  });

  it("rejects non-base64 junk", () => {
    expect(looksLikeDataForSeoKey("not-valid!!!")).toBe(false);
  });
});

describe("isTelemetryOptOutValue", () => {
  it("treats unset as not opted out", () => {
    expect(isTelemetryOptOutValue(undefined)).toBe(false);
  });

  it("treats true-ish values as opted out", () => {
    expect(isTelemetryOptOutValue("1")).toBe(true);
    expect(isTelemetryOptOutValue("true")).toBe(true);
  });

  it("treats explicit off values as not opted out", () => {
    expect(isTelemetryOptOutValue("0")).toBe(false);
    expect(isTelemetryOptOutValue("false")).toBe(false);
    expect(isTelemetryOptOutValue("off")).toBe(false);
  });
});
