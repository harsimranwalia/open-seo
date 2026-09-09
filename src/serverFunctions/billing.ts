import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuthenticatedContext } from "@/serverFunctions/middleware";

const billingUsageRangeSchema = z.object({
  start: z.number(),
  end: z.number(),
});

export type BillingUsageEvent = {
  value: number;
  properties: Record<string, string | number | boolean | null | string[]>;
};

export const getBillingUsageEvents = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(billingUsageRangeSchema)
  .handler(async (): Promise<BillingUsageEvent[]> => {
    // Billing/Autumn removed — usage chart callers get an empty series.
    return [];
  });
