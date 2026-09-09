import type { ReactNode } from "react";

export type HostedPlanGateState = {
  isLoading: boolean;
  isFreePlan: boolean;
};

const ALWAYS_PAID_PLAN_GATE: HostedPlanGateState = {
  isLoading: false,
  isFreePlan: false,
};

/** Billing is disabled — always treat the org as paid / unrestricted. */
export function HostedPlanGate({
  children,
}: {
  children: (state: HostedPlanGateState) => ReactNode;
}) {
  return children(ALWAYS_PAID_PLAN_GATE);
}
