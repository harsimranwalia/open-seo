import { describe, expect, it } from "vitest";
import { runSelfhostPreflight } from "./selfhost-preflight";

function itemFor(
  result: ReturnType<typeof runSelfhostPreflight>,
  name: string,
) {
  return result.items.find((item) => item.name === name);
}

describe("runSelfhostPreflight", () => {
  it("passes with hosted auth + DataForSEO key", () => {
    const result = runSelfhostPreflight({
      AUTH_MODE: "hosted",
      BETTER_AUTH_URL: "http://localhost:3001",
      BETTER_AUTH_SECRET: "x".repeat(40),
      DATAFORSEO_API_KEY: btoa("user@example.com:secret"),
    });

    expect(result.failed).toBe(false);
    expect(itemFor(result, "AUTH_MODE")?.level).toBe("ok");
    expect(itemFor(result, "DATAFORSEO_API_KEY")?.level).toBe("ok");
  });

  it("fails an invalid AUTH_MODE with the valid list", () => {
    const result = runSelfhostPreflight({ AUTH_MODE: "local-noauth" });

    expect(result.failed).toBe(true);
    expect(itemFor(result, "AUTH_MODE")?.message).toContain("hosted");
  });

  it("fails when Better Auth env is missing", () => {
    const result = runSelfhostPreflight({});

    expect(result.failed).toBe(true);
    const item = itemFor(result, "AUTH_MODE");
    expect(item?.message).toContain("BETTER_AUTH_URL");
    expect(item?.message).toContain("BETTER_AUTH_SECRET");
  });

  it("warns on a DataForSEO key that is not base64 login:password", () => {
    const result = runSelfhostPreflight({
      AUTH_MODE: "hosted",
      BETTER_AUTH_URL: "http://localhost:3001",
      BETTER_AUTH_SECRET: "x".repeat(40),
      DATAFORSEO_API_KEY: "raw-dashboard-key",
    });

    expect(result.failed).toBe(false);
    expect(itemFor(result, "DATAFORSEO_API_KEY")?.level).toBe("warn");
    expect(itemFor(result, "DATAFORSEO_API_KEY")?.message).toContain("base64");
  });

  it("warns that GSC stays disabled on a short BETTER_AUTH_SECRET", () => {
    const result = runSelfhostPreflight({
      AUTH_MODE: "hosted",
      BETTER_AUTH_URL: "http://localhost:3001",
      BETTER_AUTH_SECRET: "too-short",
      GOOGLE_CLIENT_ID: "id",
      GOOGLE_CLIENT_SECRET: "secret",
    });

    expect(itemFor(result, "Search Console")?.level).toBe("warn");
    expect(itemFor(result, "Search Console")?.message).toContain("32");
  });

  it("fails hosted mode listing missing Better Auth URL", () => {
    const result = runSelfhostPreflight({
      AUTH_MODE: "hosted",
      BETTER_AUTH_SECRET: "x".repeat(40),
    });

    expect(result.failed).toBe(true);
    const item = itemFor(result, "AUTH_MODE");
    expect(item?.message).toContain("BETTER_AUTH_URL");
    expect(item?.message).not.toContain("GOOGLE_CLIENT_ID");
  });

  it("mentions ALLOWED_HOST when unset", () => {
    const result = runSelfhostPreflight({
      AUTH_MODE: "hosted",
      BETTER_AUTH_URL: "http://localhost:3001",
      BETTER_AUTH_SECRET: "x".repeat(40),
    });

    expect(itemFor(result, "ALLOWED_HOST")?.level).toBe("info");
    expect(itemFor(result, "ALLOWED_HOST")?.message).toContain("reverse proxy");
  });
});
