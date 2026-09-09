import { createFileRoute } from "@tanstack/react-router";
import {
  handleSuperAdminApiError,
  jsonWithCookies,
} from "@/server/features/super-admin/http";
import { SuperAdminService } from "@/server/features/super-admin/services/SuperAdminService";

async function handleStopImpersonating(request: Request): Promise<Response> {
  try {
    const result = await SuperAdminService.stopImpersonating(request.headers);
    return jsonWithCookies({ ok: true }, result.setCookies);
  } catch (error) {
    return handleSuperAdminApiError(error, "Failed to stop impersonation");
  }
}

export const Route = createFileRoute("/api/super-admin/stop-impersonating")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) =>
        handleStopImpersonating(request),
    },
  },
});
