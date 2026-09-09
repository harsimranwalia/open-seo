import { createFileRoute } from "@tanstack/react-router";
import { responseForAppError } from "@/server/lib/http-errors";

// Self-hosted GSC OAuth callback (Cloudflare Access / local_noauth) was removed.
// Hosted GSC uses Better Auth genericOAuth instead.
async function handleCallbackRequest(_request: Request) {
  try {
    return new Response("Not found", { status: 404 });
  } catch (error) {
    return responseForAppError(error, "Search Console OAuth failed");
  }
}

export const Route = createFileRoute("/api/gsc/oauth/callback")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return handleCallbackRequest(request);
      },
    },
  },
});
