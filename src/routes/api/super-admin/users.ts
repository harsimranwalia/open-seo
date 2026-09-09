import { createFileRoute } from "@tanstack/react-router";
import { handleSuperAdminApiError } from "@/server/features/super-admin/http";
import { SuperAdminService } from "@/server/features/super-admin/services/SuperAdminService";

async function handleUsers(request: Request): Promise<Response> {
  try {
    const users = await SuperAdminService.listUsers(request.headers);
    return Response.json({ users });
  } catch (error) {
    return handleSuperAdminApiError(error, "Failed to list users");
  }
}

export const Route = createFileRoute("/api/super-admin/users")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => handleUsers(request),
    },
  },
});
