import { mcpResponse } from "@/server/mcp/formatters";
import { getAuth, type ToolExtra } from "@/server/mcp/context";
import { isHostedServerAuthMode } from "@/server/lib/runtime-env";
import { optionalMetaOutputSchema } from "@/server/mcp/output-schemas";
import { z } from "zod";

export const whoamiTool = {
  name: "whoami",
  config: {
    title: "Who am I",
    description:
      "Returns the authenticated user, organization, server mode, token scopes, and current credit balance. Uses no credits — does not call DataForSEO. Use this first to confirm connection context before choosing a project or running paid tools.",
    inputSchema: {} as Record<string, never>,
    outputSchema: {
      userId: z.string(),
      userEmail: z.string(),
      organizationId: z.string(),
      scopes: z.array(z.string()),
      mode: z.enum(["hosted", "self-hosted"]),
      creditsRemaining: z.number().nullable(),
      ...optionalMetaOutputSchema,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
  handler: async (_args: Record<string, never>, extra: ToolExtra) => {
    const auth = getAuth(extra);
    const isHosted = await isHostedServerAuthMode();
    // Billing/Autumn is disabled — report unlimited credits in hosted mode.
    const creditsRemaining = isHosted ? Number.MAX_SAFE_INTEGER : null;
    const lines = [
      `User: ${auth.userId} (${auth.userEmail})`,
      `Organization: ${auth.organizationId}`,
      `Mode: ${isHosted ? "hosted" : "self-hosted"}`,
      `Scopes: ${auth.scopes.length > 0 ? auth.scopes.join(", ") : "none"}`,
    ];
    if (isHosted) {
      lines.push(`Credits remaining: unlimited`);
    }
    return mcpResponse({
      text: lines.join("\n"),
      meta: {
        organizationId: auth.organizationId,
        creditsRemaining: creditsRemaining ?? undefined,
      },
      structuredContent: {
        userId: auth.userId,
        userEmail: auth.userEmail,
        organizationId: auth.organizationId,
        scopes: auth.scopes,
        mode: isHosted ? "hosted" : "self-hosted",
        creditsRemaining,
      },
    });
  },
};
