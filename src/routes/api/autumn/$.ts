import { createFileRoute } from "@tanstack/react-router";

function notFound() {
  return new Response("Not found", { status: 404 });
}

export const Route = createFileRoute("/api/autumn/$")({
  server: {
    handlers: {
      GET: async () => notFound(),
      POST: async () => notFound(),
    },
  },
});
