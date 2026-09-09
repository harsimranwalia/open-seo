import type { CreateMcpHandlerOptions } from "agents/mcp";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { MCP_SCOPE } from "@/lib/oauth-resource";
import {
  createWorkersOAuthMcpProps,
  MCP_AUTH_CONTEXT_PROP,
} from "@/server/mcp/context";

const serverMocks = vi.hoisted(() => ({
  nextServerId: 0,
  serverIds: new WeakMap<McpServer, number>(),
  lastServer: undefined as McpServer | undefined,
}));

vi.mock("@/server/mcp/server", () => ({
  registerOpenSeoMcpTools: vi.fn(),
}));

vi.mock("agents/mcp", () => ({
  createMcpHandler: (_server: McpServer, options: CreateMcpHandlerOptions) => {
    serverMocks.nextServerId += 1;
    serverMocks.serverIds.set(_server, serverMocks.nextServerId);
    serverMocks.lastServer = _server;

    return async () =>
      new Response(
        JSON.stringify({
          serverId: serverMocks.serverIds.get(_server),
          options,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
  },
}));

const ctx: ExecutionContext = {
  waitUntil() {},
  passThroughOnException() {},
  props: {},
};

const transportOptionsSchema = z.object({
  serverId: z.number().optional(),
  options: z.object({
    route: z.string().optional(),
    enableJsonResponse: z.boolean().optional(),
    authContext: z
      .object({
        props: z.record(z.string(), z.unknown()),
      })
      .optional(),
  }),
});

function createAuthProps() {
  return createWorkersOAuthMcpProps({
    userId: "user-1",
    userEmail: "person@example.com",
    organizationId: "org-1",
    clientId: "client-1",
    scopes: [MCP_SCOPE],
    audience: "https://open-seo.test/mcp",
    subject: "user-1",
    baseUrl: "https://open-seo.test",
  });
}

function createMcpRequest() {
  return new Request("https://open-seo.test/mcp", {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    }),
  });
}

describe("handleAuthenticatedOpenSeoMcpRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serverMocks.nextServerId = 0;
    serverMocks.serverIds = new WeakMap<McpServer, number>();
    serverMocks.lastServer = undefined;
  });

  it("rejects requests without MCP auth context", async () => {
    const { handleAuthenticatedOpenSeoMcpRequest } =
      await import("@/server/mcp/transport");

    const response = await handleAuthenticatedOpenSeoMcpRequest(
      createMcpRequest(),
      {},
      {},
      ctx,
    );

    expect(response.status).toBe(403);
  });

  it("accepts authenticated MCP requests with auth context", async () => {
    const { handleAuthenticatedOpenSeoMcpRequest } =
      await import("@/server/mcp/transport");

    const props = createAuthProps();
    const response = await handleAuthenticatedOpenSeoMcpRequest(
      createMcpRequest(),
      props,
      {},
      ctx,
    );
    const body = transportOptionsSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(
      body.options.authContext?.props[MCP_AUTH_CONTEXT_PROP],
    ).toMatchObject({
      userId: "user-1",
      userEmail: "person@example.com",
      organizationId: "org-1",
      scopes: [MCP_SCOPE],
    });
  });

  // The OOM came from the GET SSE stream pinning a per-request McpServer, so
  // GET must 405 without ever building one.
  it("returns 405 for the standalone GET SSE stream without building a server", async () => {
    const { handleAuthenticatedOpenSeoMcpRequest } =
      await import("@/server/mcp/transport");

    const response = await handleAuthenticatedOpenSeoMcpRequest(
      new Request("https://open-seo.test/mcp", {
        method: "GET",
        headers: { Accept: "text/event-stream" },
      }),
      createAuthProps(),
      {},
      ctx,
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toContain("POST");
    expect(serverMocks.nextServerId).toBe(0);
  });

  // Directory scanners (e.g. Smithery) read server metadata from initialize.
  it("serves directory metadata in the initialize response", async () => {
    const { handleAuthenticatedOpenSeoMcpRequest } =
      await import("@/server/mcp/transport");

    await handleAuthenticatedOpenSeoMcpRequest(
      createMcpRequest(),
      createAuthProps(),
      {},
      ctx,
    );
    const server = serverMocks.lastServer;
    if (!server) throw new Error("MCP server was not created");

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    const serverInfo = client.getServerVersion();
    expect(serverInfo).toMatchObject({
      name: "OpenSEO MCP",
      title: "OpenSEO",
      websiteUrl: "https://openseo.so",
      icons: [
        {
          src: "https://openseo.so/android-chrome-512x512.png",
          mimeType: "image/png",
          sizes: ["512x512"],
        },
      ],
    });
    expect(serverInfo?.description).toContain(
      "SEO research tools for AI agents",
    );

    await client.close();
  });
});
