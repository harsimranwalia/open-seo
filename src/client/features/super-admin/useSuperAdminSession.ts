import { useQuery } from "@tanstack/react-query";

export type SuperAdminSessionStatus = {
  isSuperAdmin: boolean;
  isImpersonating: boolean;
  impersonatedUser?: {
    id: string;
    email: string;
    name: string;
  };
};

export const superAdminSessionQueryKey = ["super-admin", "session"] as const;

async function fetchSuperAdminSession(): Promise<SuperAdminSessionStatus> {
  const response = await fetch("/api/super-admin/session", {
    credentials: "include",
  });
  if (!response.ok) {
    return { isSuperAdmin: false, isImpersonating: false };
  }
  return response.json();
}

export function useSuperAdminSession(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: superAdminSessionQueryKey,
    queryFn: fetchSuperAdminSession,
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    retry: false,
  });
}
