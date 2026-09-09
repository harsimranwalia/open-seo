import type { ProjectRepository } from "@/server/features/projects/repositories/ProjectRepository";

export type EnsuredProject = NonNullable<
  Awaited<ReturnType<typeof ProjectRepository.getProjectForOrganization>>
>;

export type EnsuredUserContext = {
  userId: string;
  userEmail: string;
  // Always true: email verification was removed; sessions are treated as
  // verified. Kept on the context type for callers that still read the field.
  emailVerified: boolean;
  organizationId: string;
  project?: EnsuredProject;
};
