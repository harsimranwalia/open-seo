import { createFileRoute } from "@tanstack/react-router";
import { handleSuperAdminApiError } from "@/server/features/super-admin/http";
import { SuperAdminService } from "@/server/features/super-admin/services/SuperAdminService";

async function handleSession(request: Request): Promise<Response> {
  try {
    const status = await SuperAdminService.getSessionStatus(request.headers);
    return Response.json(status);
  } catch (error) {
    return handleSuperAdminApiError(error, "Failed to read Super Admin session");
  }
}

export const Route = createFileRoute("/api/super-admin/session")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => handleSession(request),
    },
  },
});
