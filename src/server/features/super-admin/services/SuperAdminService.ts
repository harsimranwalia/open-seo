import { AppError } from "@/server/lib/errors";
import {
  buildCookieHeader,
  createImpersonationSession,
  createSuperAdminLoginCookies,
  createSuperAdminLogoutCookies,
  requireSuperAdmin,
  readImpersonation,
  stopImpersonation,
  verifySuperAdminCredentials,
  type SuperAdminCookieUpdate,
} from "@/server/auth/super-admin";
import { SuperAdminRepository } from "@/server/features/super-admin/repositories/SuperAdminRepository";

export type SuperAdminSessionStatus = {
  isSuperAdmin: boolean;
  isImpersonating: boolean;
  impersonatedUser?: {
    id: string;
    email: string;
    name: string;
  };
};

export type SuperAdminMutationResult = {
  setCookies: string[];
};

async function materializeCookies(
  updates: SuperAdminCookieUpdate[],
  clearCookies: string[] = [],
): Promise<string[]> {
  const setCookies = await Promise.all(updates.map(buildCookieHeader));
  return [...clearCookies, ...setCookies];
}

async function login(input: {
  email: string;
  password: string;
}): Promise<SuperAdminMutationResult> {
  const ok = await verifySuperAdminCredentials(input.email, input.password);
  if (!ok) {
    throw new AppError("UNAUTHENTICATED", "Invalid Super Admin credentials");
  }

  const updates = await createSuperAdminLoginCookies(input.email.trim());
  return { setCookies: await materializeCookies(updates) };
}

async function logout(headers: Headers): Promise<SuperAdminMutationResult> {
  await requireSuperAdmin(headers);
  const stopResult = await stopImpersonation(headers);
  return {
    setCookies: [
      ...stopResult.clearCookies,
      ...createSuperAdminLogoutCookies(),
    ],
  };
}

async function listUsers(headers: Headers) {
  await requireSuperAdmin(headers);
  return SuperAdminRepository.listUsers();
}

async function getSessionStatus(
  headers: Headers,
): Promise<SuperAdminSessionStatus> {
  try {
    await requireSuperAdmin(headers);
  } catch {
    return { isSuperAdmin: false, isImpersonating: false };
  }

  const impersonation = await readImpersonation(headers);
  if (!impersonation) {
    return { isSuperAdmin: true, isImpersonating: false };
  }

  const user = await SuperAdminRepository.getUserById(
    impersonation.targetUserId,
  );

  return {
    isSuperAdmin: true,
    isImpersonating: true,
    impersonatedUser: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      : {
          id: impersonation.targetUserId,
          email: impersonation.targetEmail,
          name: impersonation.targetEmail,
        },
  };
}

async function impersonate(
  headers: Headers,
  userId: string,
): Promise<SuperAdminMutationResult> {
  await requireSuperAdmin(headers);

  const target = await SuperAdminRepository.getUserById(userId);
  if (!target) {
    throw new AppError("NOT_FOUND", "User not found");
  }

  const result = await createImpersonationSession({
    targetUserId: target.id,
    targetEmail: target.email,
    ipAddress: headers.get("cf-connecting-ip"),
    userAgent: headers.get("user-agent"),
  });

  return {
    setCookies: await materializeCookies(result.cookies, result.clearCookies),
  };
}

async function stopImpersonating(
  headers: Headers,
): Promise<SuperAdminMutationResult> {
  await requireSuperAdmin(headers);
  const result = await stopImpersonation(headers);
  return { setCookies: result.clearCookies };
}

export const SuperAdminService = {
  login,
  logout,
  listUsers,
  getSessionStatus,
  impersonate,
  stopImpersonating,
} as const;
