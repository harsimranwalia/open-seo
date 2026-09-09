import { createFileRoute } from "@tanstack/react-router";
import {
  handleSuperAdminApiError,
  jsonWithCookies,
} from "@/server/features/super-admin/http";
import { SuperAdminService } from "@/server/features/super-admin/services/SuperAdminService";

async function handleLogout(request: Request): Promise<Response> {
  try {
    const result = await SuperAdminService.logout(request.headers);
    return jsonWithCookies({ ok: true }, result.setCookies);
  } catch (error) {
    return handleSuperAdminApiError(error, "Super Admin logout failed");
  }
}

export const Route = createFileRoute("/api/super-admin/logout")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => handleLogout(request),
    },
  },
});
