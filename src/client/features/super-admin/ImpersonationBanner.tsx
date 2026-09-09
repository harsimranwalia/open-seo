import { useMutation } from "@tanstack/react-query";
import { SUPER_ADMIN_DASHBOARD_ROUTE } from "@/shared/super-admin";
import { useSuperAdminSession } from "@/client/features/super-admin/useSuperAdminSession";

export function ImpersonationBanner() {
  const sessionQuery = useSuperAdminSession();

  const stopMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/super-admin/stop-impersonating", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to stop impersonation");
      }
    },
    onSuccess: () => {
      window.location.assign(SUPER_ADMIN_DASHBOARD_ROUTE);
    },
  });

  if (!sessionQuery.data?.isImpersonating || !sessionQuery.data.impersonatedUser) {
    return null;
  }

  const user = sessionQuery.data.impersonatedUser;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warning/40 bg-warning/15 px-4 py-2 text-sm">
      <p className="text-base-content">
        Viewing as{" "}
        <span className="font-medium">
          {user.name || user.email}
        </span>
        {user.name ? (
          <span className="text-base-content/60"> ({user.email})</span>
        ) : null}
        . Super Admin session is preserved.
      </p>
      <button
        type="button"
        className="btn btn-sm btn-warning"
        disabled={stopMutation.isPending}
        onClick={() => stopMutation.mutate()}
      >
        {stopMutation.isPending ? "Returning..." : "Return to Super Admin"}
      </button>
    </div>
  );
}
