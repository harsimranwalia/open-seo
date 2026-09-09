import { SignJWT, jwtVerify } from "jose";
import { getCookies } from "better-auth/cookies";
import { env } from "cloudflare:workers";
import { getAuth } from "@/lib/auth";
import { getOrCreateDefaultHostedOrganization } from "@/server/auth/default-hosted-organization";
import { AppError } from "@/server/lib/errors";
import { getOptionalEnvValue } from "@/server/lib/runtime-env";
import { SuperAdminRepository } from "@/server/features/super-admin/repositories/SuperAdminRepository";
import {
  readRequestCookie,
  serializePlainCookie,
  serializeSignedCookieHeader,
  timingSafeEqualString,
} from "@/server/auth/super-admin-cookies";
import {
  SUPER_ADMIN_COOKIE,
  SUPER_ADMIN_IMPERSONATING_COOKIE,
  SUPER_ADMIN_IMPERSONATION_TTL_SECONDS,
  SUPER_ADMIN_SESSION_TTL_SECONDS,
} from "@/shared/super-admin";

export { readRequestCookie, timingSafeEqualString };

type SuperAdminJwtPayload = {
  typ: "super_admin";
  email: string;
};

type ImpersonationJwtPayload = {
  typ: "sa_impersonation";
  targetUserId: string;
  targetEmail: string;
};

export type SuperAdminCookieUpdate = {
  name: string;
  value: string;
  maxAge: number;
  signed?: boolean;
};

export type SuperAdminIdentity = {
  email: string;
};

export type ImpersonationIdentity = {
  targetUserId: string;
  targetEmail: string;
};

export async function getSuperAdminCredentials(): Promise<{
  email: string;
  password: string;
} | null> {
  const email = (await getOptionalEnvValue("SUPER_ADMIN_EMAIL"))?.trim();
  const password = (await getOptionalEnvValue("SUPER_ADMIN_PASSWORD"))?.trim();
  if (!email || !password) {
    return null;
  }
  return { email, password };
}

export async function verifySuperAdminCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  const configured = await getSuperAdminCredentials();
  if (!configured) {
    return false;
  }

  const emailOk = await timingSafeEqualString(
    email.trim().toLowerCase(),
    configured.email.toLowerCase(),
  );
  const passwordOk = await timingSafeEqualString(
    password,
    configured.password,
  );
  return emailOk && passwordOk;
}

async function getJwtSecretKey(): Promise<Uint8Array> {
  const secret = (await getOptionalEnvValue("BETTER_AUTH_SECRET"))?.trim();
  if (!secret || secret.length < 32) {
    throw new AppError(
      "AUTH_CONFIG_MISSING",
      "BETTER_AUTH_SECRET is required for Super Admin",
    );
  }
  return new TextEncoder().encode(secret);
}

async function getBetterAuthSecret(): Promise<string> {
  const secret = (await getOptionalEnvValue("BETTER_AUTH_SECRET"))?.trim();
  if (!secret || secret.length < 32) {
    throw new AppError(
      "AUTH_CONFIG_MISSING",
      "BETTER_AUTH_SECRET is required for Super Admin",
    );
  }
  return secret;
}

function useSecureCookies(): boolean {
  const baseUrl = env.BETTER_AUTH_URL?.trim();
  if (baseUrl) {
    return baseUrl.startsWith("https://");
  }
  return process.env.NODE_ENV === "production";
}

function baseCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: useSecureCookies(),
    sameSite: "Lax" as const,
    path: "/",
    maxAge,
  };
}

export async function signSuperAdminToken(email: string): Promise<string> {
  const secret = await getJwtSecretKey();
  return new SignJWT({
    typ: "super_admin",
    email,
  } satisfies SuperAdminJwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SUPER_ADMIN_SESSION_TTL_SECONDS}s`)
    .sign(secret);
}

export async function signImpersonationToken(input: {
  targetUserId: string;
  targetEmail: string;
}): Promise<string> {
  const secret = await getJwtSecretKey();
  return new SignJWT({
    typ: "sa_impersonation",
    targetUserId: input.targetUserId,
    targetEmail: input.targetEmail,
  } satisfies ImpersonationJwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SUPER_ADMIN_IMPERSONATION_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifySuperAdminToken(
  token: string,
): Promise<SuperAdminIdentity | null> {
  try {
    const secret = await getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    if (payload.typ !== "super_admin" || typeof payload.email !== "string") {
      return null;
    }
    return { email: payload.email };
  } catch {
    return null;
  }
}

export async function verifyImpersonationToken(
  token: string,
): Promise<ImpersonationIdentity | null> {
  try {
    const secret = await getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    if (
      payload.typ !== "sa_impersonation" ||
      typeof payload.targetUserId !== "string" ||
      typeof payload.targetEmail !== "string"
    ) {
      return null;
    }
    return {
      targetUserId: payload.targetUserId,
      targetEmail: payload.targetEmail,
    };
  } catch {
    return null;
  }
}

/** Requires a valid Super Admin cookie. Rejects normal better-auth sessions alone. */
export async function requireSuperAdmin(
  headers: Headers,
): Promise<SuperAdminIdentity> {
  const token = readRequestCookie(headers, SUPER_ADMIN_COOKIE);
  if (!token) {
    throw new AppError("UNAUTHENTICATED", "Super Admin authentication required");
  }
  const identity = await verifySuperAdminToken(token);
  if (!identity) {
    throw new AppError("UNAUTHENTICATED", "Super Admin authentication required");
  }
  return identity;
}

export async function readImpersonation(
  headers: Headers,
): Promise<ImpersonationIdentity | null> {
  const token = readRequestCookie(headers, SUPER_ADMIN_IMPERSONATING_COOKIE);
  if (!token) {
    return null;
  }
  return verifyImpersonationToken(token);
}

function createSecureToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSessionCookieConfig() {
  const auth = getAuth();
  const context = await auth.$context;
  return getCookies(context.options).sessionToken;
}

async function getSessionDataCookieConfig() {
  const auth = getAuth();
  const context = await auth.$context;
  return getCookies(context.options).sessionData;
}

export async function buildCookieHeader(
  update: SuperAdminCookieUpdate,
): Promise<string> {
  const options = baseCookieOptions(update.maxAge);
  if (update.signed) {
    const secret = await getBetterAuthSecret();
    return serializeSignedCookieHeader(
      update.name,
      update.value,
      secret,
      options,
    );
  }
  return serializePlainCookie(update.name, update.value, options);
}

export function buildClearCookieHeader(
  name: string,
  attributes?: { secure?: boolean; path?: string; httpOnly?: boolean },
): string {
  return serializePlainCookie(name, "", {
    httpOnly: attributes?.httpOnly ?? true,
    secure: attributes?.secure ?? useSecureCookies(),
    sameSite: "Lax",
    path: attributes?.path ?? "/",
    maxAge: 0,
  });
}

export async function createSuperAdminLoginCookies(
  email: string,
): Promise<SuperAdminCookieUpdate[]> {
  const token = await signSuperAdminToken(email);
  return [
    {
      name: SUPER_ADMIN_COOKIE,
      value: token,
      maxAge: SUPER_ADMIN_SESSION_TTL_SECONDS,
    },
  ];
}

export function createSuperAdminLogoutCookies(): string[] {
  return [
    buildClearCookieHeader(SUPER_ADMIN_COOKIE),
    buildClearCookieHeader(SUPER_ADMIN_IMPERSONATING_COOKIE),
  ];
}

export async function createImpersonationSession(input: {
  targetUserId: string;
  targetEmail: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{
  cookies: SuperAdminCookieUpdate[];
  clearCookies: string[];
}> {
  const auth = getAuth();
  const organizationId = await getOrCreateDefaultHostedOrganization(
    input.targetUserId,
    (body) => auth.api.createOrganization({ body }),
  );

  const expiresAt = new Date(
    Date.now() + SUPER_ADMIN_IMPERSONATION_TTL_SECONDS * 1000,
  );
  const token = createSecureToken();
  const sessionId = crypto.randomUUID();

  await SuperAdminRepository.createSession({
    id: sessionId,
    token,
    userId: input.targetUserId,
    expiresAt,
    activeOrganizationId: organizationId,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });

  const sessionCookie = await getSessionCookieConfig();
  const sessionDataCookie = await getSessionDataCookieConfig();
  const impersonationJwt = await signImpersonationToken({
    targetUserId: input.targetUserId,
    targetEmail: input.targetEmail,
  });

  return {
    cookies: [
      {
        name: sessionCookie.name,
        value: token,
        maxAge: SUPER_ADMIN_IMPERSONATION_TTL_SECONDS,
        signed: true,
      },
      {
        name: SUPER_ADMIN_IMPERSONATING_COOKIE,
        value: impersonationJwt,
        maxAge: SUPER_ADMIN_IMPERSONATION_TTL_SECONDS,
      },
    ],
    clearCookies: [
      buildClearCookieHeader(sessionDataCookie.name, {
        secure: sessionDataCookie.attributes.secure,
        path: sessionDataCookie.attributes.path,
        httpOnly: sessionDataCookie.attributes.httpOnly,
      }),
    ],
  };
}

export async function stopImpersonation(headers: Headers): Promise<{
  clearCookies: string[];
}> {
  const sessionCookie = await getSessionCookieConfig();
  const sessionDataCookie = await getSessionDataCookieConfig();

  const rawSessionCookie = readRequestCookie(headers, sessionCookie.name);
  if (rawSessionCookie) {
    const token = rawSessionCookie.split(".")[0];
    if (token) {
      await SuperAdminRepository.deleteSessionByToken(token);
    }
  }

  return {
    clearCookies: [
      buildClearCookieHeader(SUPER_ADMIN_IMPERSONATING_COOKIE),
      buildClearCookieHeader(sessionCookie.name, {
        secure: sessionCookie.attributes.secure,
        path: sessionCookie.attributes.path,
        httpOnly: sessionCookie.attributes.httpOnly,
      }),
      buildClearCookieHeader(sessionDataCookie.name, {
        secure: sessionDataCookie.attributes.secure,
        path: sessionDataCookie.attributes.path,
        httpOnly: sessionDataCookie.attributes.httpOnly,
      }),
    ],
  };
}
