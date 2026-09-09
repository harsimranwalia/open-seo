import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  superAdminSessionQueryKey,
  useSuperAdminSession,
} from "@/client/features/super-admin/useSuperAdminSession";
import { SUPER_ADMIN_LOGIN_ROUTE } from "@/shared/super-admin";

type ListedUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  emailVerified: boolean;
};

export const Route = createFileRoute("/super-admin/")({
  component: SuperAdminDashboardPage,
});

function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionQuery = useSuperAdminSession();

  useEffect(() => {
    if (sessionQuery.isPending) return;
    if (!sessionQuery.data?.isSuperAdmin) {
      void navigate({ to: SUPER_ADMIN_LOGIN_ROUTE, replace: true });
    }
  }, [navigate, sessionQuery.data?.isSuperAdmin, sessionQuery.isPending]);

  const usersQuery = useQuery({
    queryKey: ["super-admin", "users"],
    queryFn: async (): Promise<ListedUser[]> => {
      const response = await fetch("/api/super-admin/users", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to load users");
      }
      const data: {
        users: Array<{
          id: string;
          name: string;
          email: string;
          createdAt: string | Date;
          emailVerified: boolean;
        }>;
      } = await response.json();
      return data.users.map((user) => ({
        ...user,
        createdAt:
          typeof user.createdAt === "string"
            ? user.createdAt
            : new Date(user.createdAt).toISOString(),
      }));
    },
    enabled: Boolean(sessionQuery.data?.isSuperAdmin),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/super-admin/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: superAdminSessionQueryKey });
      void navigate({ to: SUPER_ADMIN_LOGIN_ROUTE });
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch("/api/super-admin/impersonate", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        throw new Error("Impersonation failed");
      }
    },
    onSuccess: () => {
      // Full reload so better-auth session hooks pick up the new signed cookie.
      window.location.assign("/");
    },
  });

  if (sessionQuery.isPending || !sessionQuery.data?.isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-base-200 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Super Admin</h1>
            <p className="text-sm text-base-content/60">
              Registered users. Access Account starts an impersonation session
              without reading passwords.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            {logoutMutation.isPending ? "Signing out..." : "Sign out"}
          </button>
        </div>

        {sessionQuery.data.isImpersonating ? (
          <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
            Currently impersonating{" "}
            <span className="font-medium">
              {sessionQuery.data.impersonatedUser?.email}
            </span>
            . Use the banner in the app to return here.
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Verified</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {usersQuery.isPending ? (
                <tr>
                  <td colSpan={5} className="text-base-content/60">
                    Loading users...
                  </td>
                </tr>
              ) : null}
              {usersQuery.isError ? (
                <tr>
                  <td colSpan={5} className="text-error">
                    Failed to load users.
                  </td>
                </tr>
              ) : null}
              {usersQuery.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-base-content/60">
                    No registered users yet.
                  </td>
                </tr>
              ) : null}
              {usersQuery.data?.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || "—"}</td>
                  <td>{user.email}</td>
                  <td>{user.emailVerified ? "Yes" : "No"}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={impersonateMutation.isPending}
                      onClick={() => impersonateMutation.mutate(user.id)}
                    >
                      Access Account
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
