import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  handleSuperAdminApiError,
  jsonWithCookies,
  readJsonBody,
} from "@/server/features/super-admin/http";
import { SuperAdminService } from "@/server/features/super-admin/services/SuperAdminService";

const impersonateBodySchema = z.object({
  userId: z.string().min(1),
});

async function handleImpersonate(request: Request): Promise<Response> {
  try {
    const body = await readJsonBody(request, (value) =>
      impersonateBodySchema.parse(value),
    );
    const result = await SuperAdminService.impersonate(
      request.headers,
      body.userId,
    );
    return jsonWithCookies({ ok: true }, result.setCookies);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid impersonate payload", { status: 400 });
    }
    return handleSuperAdminApiError(error, "Impersonation failed");
  }
}

export const Route = createFileRoute("/api/super-admin/impersonate")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) =>
        handleImpersonate(request),
    },
  },
});
