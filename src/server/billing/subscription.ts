import type { EnsuredUserContext } from "@/middleware/ensure-user/types";
import type { CreditFeature } from "@/shared/billing-credit-features";

export type BillingCustomerContext = Pick<
  EnsuredUserContext,
  "organizationId" | "userEmail" | "userId"
> & {
  projectId?: string;
};

/**
 * Billing/Autumn is disabled. These helpers keep call sites working without
 * requiring AUTUMN_* secrets or network calls.
 */
export async function getOrCreateOrganizationCustomer(
  context: BillingCustomerContext,
): Promise<{ id: string }> {
  return { id: context.organizationId };
}

export async function customerHasPaidPlan(_customerId: string) {
  return true;
}

export async function customerHasManagedAccess(_customerId: string) {
  return true;
}

export async function checkUsageCreditsDepleted(
  _customer: BillingCustomerContext,
): Promise<{ depleted: boolean; monthlyRemaining: number }> {
  return { depleted: false, monthlyRemaining: Number.MAX_SAFE_INTEGER };
}

export async function assertUsageCreditsAvailable(
  _customerId: string,
): Promise<{ monthlyRemaining: number }> {
  return { monthlyRemaining: Number.MAX_SAFE_INTEGER };
}

export async function trackUsageCreditSpend(_args: {
  customer: BillingCustomerContext;
  customerId: string;
  creditFeature: CreditFeature;
  costUsd: number;
  monthlyRemaining: number;
  properties?: Record<string, unknown>;
}): Promise<void> {
  return;
}
