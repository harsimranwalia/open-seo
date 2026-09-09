import type { LucideIcon } from "lucide-react";

type Props = {
  feature: string;
  description: string;
  bullets: Array<{ icon: LucideIcon; title: string; body: string }>;
};

/** Billing is disabled — never show the paid-plan paywall. */
export function AiSearchPaidPlanGate(_props: Props) {
  return null;
}
