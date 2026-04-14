import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { loadConfig } from "./config.js";
import { FileCache } from "./kosis/cache.js";
import { KosisClient } from "./kosis/client.js";
import { KosisService } from "./kosis/service.js";

function asToolResult<T extends object>(structuredContent: T) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(structuredContent, null, 2),
      },
    ],
    structuredContent: structuredContent as Record<string, unknown>,
  };
}

function createServer(service: KosisService): McpServer {
  const server = new McpServer({
    name: "kosis-question-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "kosis_search_topics",
    {
      title: "KOSIS Topic Search",
      description:
        "Break a natural-language question into KOSIS search queries and return ranked related tables.",
      inputSchema: {
        question: z.string().min(2),
        searchHints: z.array(z.string().min(1)).optional(),
        limit: z.number().int().min(1).max(20).optional(),
      },
      outputSchema: {
        queryPlan: z.array(
          z.object({
            query: z.string(),
            reason: z.string(),
          }),
        ),
        results: z.array(
          z.object({
            tableKey: z.string(),
            orgId: z.string(),
            tblId: z.string(),
            statId: z.string().optional(),
            tblNm: z.string(),
            statNm: z.string().optional(),
            organization: z.string().optional(),
            period: z.object({
              start: z.string().optional(),
              end: z.string().optional(),
            }),
            path: z.string().optional(),
            score: z.number(),
            whyMatched: z.array(z.string()),
            raw: z.record(z.unknown()),
          }),
        ),
      },
    },
    async ({ question, searchHints, limit }) =>
      asToolResult(await service.searchTopics(question, searchHints, limit)),
  );

  server.registerTool(
    "kosis_get_table_bundle",
    {
      title: "KOSIS Table Bundle",
      description:
        "Fetch a KOSIS table bundle including preview data, metadata, and explanation fields.",
      inputSchema: {
        orgId: z.string().min(1),
        tblId: z.string().min(1),
        prdSe: z.string().min(1).optional(),
        dimensionSelections: z
          .record(z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]))
          .optional(),
        itemSelection: z.string().min(1).optional(),
        newEstPrdCnt: z.number().int().min(1).max(24).optional(),
        startPrdDe: z.string().min(1).optional(),
        endPrdDe: z.string().min(1).optional(),
      },
    },
    async ({
      orgId,
      tblId,
      prdSe,
      dimensionSelections,
      itemSelection,
      newEstPrdCnt,
      startPrdDe,
      endPrdDe,
    }) =>
      asToolResult(
        await service.getTableBundle(orgId, tblId, prdSe, {
          dimensionSelections,
          itemSelection,
          newEstPrdCnt,
          startPrdDe,
          endPrdDe,
        }),
      ),
  );

  server.registerTool(
    "kosis_compare_tables",
    {
      title: "KOSIS Compare Tables",
      description:
        "Compare multiple KOSIS tables and produce common dimensions, differences, and analysis hints.",
      inputSchema: {
        tables: z
          .array(
            z.object({
              orgId: z.string().min(1),
              tblId: z.string().min(1),
              prdSe: z.string().min(1).optional(),
            }),
          )
          .min(2)
          .max(5),
        focus: z.string().optional(),
        timeRange: z.string().optional(),
        regions: z.array(z.string()).optional(),
      },
    },
    async ({ tables, focus, timeRange, regions }) =>
      asToolResult(await service.compareTables(tables, { focus, timeRange, regions })),
  );

  server.registerTool(
    "kosis_answer_bundle",
    {
      title: "KOSIS Answer Bundle",
      description:
        "Take a natural-language question, find related KOSIS tables, bundle evidence, and optionally compare them.",
      inputSchema: {
        question: z.string().min(2),
        limit: z.number().int().min(1).max(10).optional(),
        comparisonMode: z.enum(["auto", "none", "pairwise"]).optional(),
        searchHints: z.array(z.string().min(1)).optional(),
      },
    },
    async ({ question, limit, comparisonMode, searchHints }) =>
      asToolResult(
        await service.answerBundle(question, {
          limit,
          comparisonMode,
          searchHints,
        }),
      ),
  );

  return server;
}

function buildService(
  config: ReturnType<typeof loadConfig>,
  apiKey?: string,
): KosisService {
  const resolvedConfig = {
    ...config,
    apiKey: apiKey ?? config.apiKey,
  };
  const client = new KosisClient(resolvedConfig);
  const cache = new FileCache(config.cacheDir, config.cacheTtlMs);
  return new KosisService(client, cache, config.defaultResultLimit);
}

function extractBearerToken(authHeader?: string): string | undefined {
  if (!authHeader) {
    return undefined;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

async function startStdioServer(
  config: ReturnType<typeof loadConfig>,
): Promise<void> {
  const cache = new FileCache(config.cacheDir, config.cacheTtlMs);

  if (config.clearCacheOnStart) {
    await cache.clearAll();
  }

  const service = buildService(config);
  const server = createServer(service);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function startHttpServer(
  config: ReturnType<typeof loadConfig>,
): Promise<void> {
  if (!config.serverToken) {
    throw new Error(
      "MCP_SERVER_TOKEN is required in HTTP mode to protect the remote MCP server.",
    );
  }

  const cache = new FileCache(config.cacheDir, config.cacheTtlMs);
  if (config.clearCacheOnStart) {
    await cache.clearAll();
  }

  const app = createMcpExpressApp({ host: config.host });

  app.get("/healthz", (_req: any, res: any) => {
    res.status(200).json({ ok: true });
  });

  app.post("/mcp", async (req: any, res: any) => {
    const bearerToken = extractBearerToken(req.header("authorization"));
    if (bearerToken !== config.serverToken) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Unauthorized",
        },
        id: null,
      });
      return;
    }

    const userApiKey = req.header("x-kosis-api-key");
    if (!userApiKey) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32602,
          message: "Missing X-Kosis-Api-Key header",
        },
        id: null,
      });
      return;
    }

    const service = buildService(config, userApiKey);
    const server = createServer(service);

    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on("close", () => {
        transport.close().catch(() => undefined);
        server.close();
      });
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", async (_req: any, res: any) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      }),
    );
  });

  app.delete("/mcp", async (_req: any, res: any) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      }),
    );
  });

  await new Promise<void>((resolve, reject) => {
    app.listen(config.port, config.host, (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }
      console.log(
        `KOSIS MCP HTTP server listening on http://${config.host}:${config.port}/mcp`,
      );
      resolve();
    });
  });
}

async function main(): Promise<void> {
  const config = loadConfig();

  if (config.transportMode === "http") {
    await startHttpServer(config);
    return;
  }

  await startStdioServer(config);
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
