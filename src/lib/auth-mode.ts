// Auth is always Better Auth (hosted sessions). These stubs keep call sites
// working without mode branching.

export const AUTH_MODES = ["hosted"] as const;

type AuthMode = (typeof AUTH_MODES)[number];

export function getAuthMode(_value?: string | null): AuthMode {
  return "hosted";
}

export function isHostedAuthMode(_value?: string | null) {
  return true;
}

export function isHostedClientAuthMode() {
  return true;
}

export function isEmailVerificationBypassed() {
  // Email verification was removed; leftover guards treat sessions as verified.
  return true;
}
