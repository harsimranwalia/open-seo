import { describe, expect, it } from "vitest";
import {
  getHostedTurnstileSecretKey,
  hasHostedTurnstileConfig,
} from "@/lib/auth-turnstile";

describe("hosted Turnstile auth config", () => {
  it("enforces captcha from the server secret even when the runtime site key is absent", () => {
    expect(
      getHostedTurnstileSecretKey({
        TURNSTILE_SECRET_KEY: " server-secret ",
      }),
    ).toBe("server-secret");
  });

  it("returns undefined when no Turnstile secret is configured", () => {
    expect(getHostedTurnstileSecretKey({})).toBeUndefined();
  });

  it("fails config when a runtime site key is configured without a secret", () => {
    expect(
      hasHostedTurnstileConfig({
        TURNSTILE_SITE_KEY: "site-key",
      }),
    ).toBe(false);
  });

  it("allows config with no runtime site key so build/runtime divergence can still enforce from the secret", () => {
    expect(
      hasHostedTurnstileConfig({
        TURNSTILE_SECRET_KEY: "server-secret",
      }),
    ).toBe(true);
  });
});
