import { describe, expect, it } from "vitest";
import { serializeSignedCookieHeader } from "@/server/auth/super-admin-cookies";

/**
 * better-call's getSignedCookie rejects signatures that are not standard
 * base64 of length 44 ending in `=`. Regression for impersonation cookies.
 */
describe("serializeSignedCookieHeader", () => {
  it("signs with padded standard base64 (better-call compatible)", async () => {
    const header = await serializeSignedCookieHeader(
      "better-auth.session_token",
      "abc123token",
      "x".repeat(32),
      {
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        path: "/",
        maxAge: 3600,
      },
    );

    const value = header.slice("better-auth.session_token=".length).split(";")[0];
    const decoded = decodeURIComponent(value ?? "");
    const signature = decoded.slice(decoded.lastIndexOf(".") + 1);

    expect(decoded.startsWith("abc123token.")).toBe(true);
    expect(signature).toHaveLength(44);
    expect(signature.endsWith("=")).toBe(true);
    expect(signature).not.toMatch(/[-_]/);
  });
});
