import { describe, expect, it } from "vitest";
import {
  assertUsageCreditsAvailable,
  checkUsageCreditsDepleted,
  customerHasManagedAccess,
  customerHasPaidPlan,
  getOrCreateOrganizationCustomer,
  trackUsageCreditSpend,
} from "./subscription";

describe("subscription billing (Autumn disabled)", () => {
  it("always reports paid plan", async () => {
    await expect(customerHasPaidPlan("org_123")).resolves.toBe(true);
  });

  it("always reports managed access", async () => {
    await expect(customerHasManagedAccess("org_123")).resolves.toBe(true);
  });

  it("returns the organization id as the customer id", async () => {
    await expect(
      getOrCreateOrganizationCustomer({
        organizationId: "org_123",
        userId: "user_123",
        userEmail: "alice@example.com",
      }),
    ).resolves.toEqual({ id: "org_123" });
  });

  it("never reports depleted credits", async () => {
    await expect(
      checkUsageCreditsDepleted({
        organizationId: "org_123",
        userId: "user_123",
        userEmail: "alice@example.com",
      }),
    ).resolves.toEqual({
      depleted: false,
      monthlyRemaining: Number.MAX_SAFE_INTEGER,
    });
  });

  it("always asserts credits available", async () => {
    await expect(assertUsageCreditsAvailable("org_123")).resolves.toEqual({
      monthlyRemaining: Number.MAX_SAFE_INTEGER,
    });
  });

  it("no-ops credit spend tracking", async () => {
    await expect(
      trackUsageCreditSpend({
        customer: {
          organizationId: "org_123",
          userId: "user_123",
          userEmail: "alice@example.com",
        },
        customerId: "org_123",
        creditFeature: "keyword_research",
        costUsd: 1,
        monthlyRemaining: 100,
      }),
    ).resolves.toBeUndefined();
  });
});
