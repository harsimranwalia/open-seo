export const AUTUMN_WEBHOOK_PATH = "/api/autumn/webhook";

/** Autumn billing is disabled — webhook always 404s. */
export async function handleAutumnWebhookRequest(_request: Request) {
  return new Response("Not found", { status: 404 });
}
