import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";
import {
  AuthPageCard,
  AuthPageShell,
} from "@/client/features/auth/AuthPage";
import { getFieldError, getFormError } from "@/client/lib/forms";
import {
  superAdminSessionQueryKey,
  useSuperAdminSession,
} from "@/client/features/super-admin/useSuperAdminSession";
import { SUPER_ADMIN_DASHBOARD_ROUTE } from "@/shared/super-admin";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const Route = createFileRoute("/super-admin/login")({
  component: SuperAdminLoginPage,
});

function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionQuery = useSuperAdminSession();

  useEffect(() => {
    if (sessionQuery.data?.isSuperAdmin) {
      void navigate({ to: SUPER_ADMIN_DASHBOARD_ROUTE, replace: true });
    }
  }, [navigate, sessionQuery.data?.isSuperAdmin]);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ formApi, value }) => {
      try {
        const response = await fetch("/api/super-admin/login", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: value.email.trim(),
            password: value.password,
          }),
        });

        if (!response.ok) {
          formApi.setErrorMap({
            onSubmit: {
              form: "Invalid Super Admin credentials.",
              fields: {},
            },
          });
          return;
        }

        await queryClient.invalidateQueries({
          queryKey: superAdminSessionQueryKey,
        });
        void navigate({ to: SUPER_ADMIN_DASHBOARD_ROUTE });
      } catch {
        formApi.setErrorMap({
          onSubmit: {
            form: "Unable to sign in right now. Please try again.",
            fields: {},
          },
        });
      }
    },
  });

  if (sessionQuery.isPending || sessionQuery.data?.isSuperAdmin) {
    return null;
  }

  return (
    <AuthPageShell>
      <AuthPageCard
        title="Super Admin"
        helperText="Sign in with Super Admin credentials from the server environment."
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name="email">
            {(field) => {
              const error = getFieldError(field.state.meta.errors);
              return (
                <div>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    placeholder="Email address..."
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    autoComplete="username"
                    required
                  />
                  {error ? (
                    <p className="mt-1 text-sm text-error">{error}</p>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              const error = getFieldError(field.state.meta.errors);
              return (
                <div>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    placeholder="Password..."
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  {error ? (
                    <p className="mt-1 text-sm text-error">{error}</p>
                  ) : null}
                </div>
              );
            }}
          </form.Field>

          <form.Subscribe
            selector={(state) => ({
              submitError: state.errorMap.onSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ submitError, isSubmitting }) => {
              const errorMessage = getFormError(submitError);
              return (
                <>
                  {errorMessage ? (
                    <p className="text-sm text-error">{errorMessage}</p>
                  ) : null}
                  <button className="btn btn-soft w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </button>
                </>
              );
            }}
          </form.Subscribe>
        </form>
      </AuthPageCard>
    </AuthPageShell>
  );
}
