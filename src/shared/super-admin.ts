export const SUPER_ADMIN_LOGIN_ROUTE = "/super-admin/login";
export const SUPER_ADMIN_DASHBOARD_ROUTE = "/super-admin";

/** HttpOnly JWT cookie for the Super Admin session (not a better-auth user). */
export const SUPER_ADMIN_COOKIE = "openseo_sa";

/** HttpOnly JWT cookie set only while Super Admin is impersonating a user. */
export const SUPER_ADMIN_IMPERSONATING_COOKIE = "openseo_sa_impersonating";

export const SUPER_ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const SUPER_ADMIN_IMPERSONATION_TTL_SECONDS = 60 * 60;
