import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  handleSuperAdminApiError,
  jsonWithCookies,
  readJsonBody,
} from "@/server/features/super-admin/http";
import { SuperAdminService } from "@/server/features/super-admin/services/SuperAdminService";

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function handleLogin(request: Request): Promise<Response> {
  try {
    const body = await readJsonBody(request, (value) =>
      loginBodySchema.parse(value),
    );
    const result = await SuperAdminService.login(body);
    return jsonWithCookies({ ok: true }, result.setCookies);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid login payload", { status: 400 });
    }
    return handleSuperAdminApiError(error, "Super Admin login failed");
  }
}

export const Route = createFileRoute("/api/super-admin/login")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => handleLogin(request),
    },
  },
});
