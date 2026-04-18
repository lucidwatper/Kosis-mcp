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

const queryPlanItemSchema = z.object({
  query: z.string(),
  reason: z.string(),
});

const plannerIndicatorCandidateSchema = z.object({
  label: z.string(),
  source: z.enum(["measure", "compare-target", "focus-term", "domain-family"]),
  priority: z.number().int(),
  searchHints: z.array(z.string()),
});

const plannerComparisonAxisSchema = z.object({
  axis: z.enum(["indicator", "sex", "age", "region", "time"]),
  values: z.array(z.string()),
  required: z.boolean(),
  reason: z.string(),
});

const plannerDatasetSchema = z.object({
  datasetId: z.string(),
  lane: z.enum(["table-search", "indicator-search", "catalog-browse"]),
  requirement: z.enum(["required", "optional"]),
  label: z.string(),
  seedQuestion: z.string(),
  reason: z.string(),
  searchHints: z.array(z.string()),
  queries: z.array(queryPlanItemSchema),
});

const plannerSchema = z.object({
  question: z.string(),
  primaryIntent: z.enum(["search", "browse", "explain", "compare", "value", "trend"]),
  goal: z.string(),
  indicatorCandidates: z.array(plannerIndicatorCandidateSchema),
  comparisonAxes: z.array(plannerComparisonAxisSchema),
  period: z.object({
    preferredPrdSe: z.enum(["Y", "M", "Q", "S", "W", "D"]).optional(),
    startPrdDe: z.string().optional(),
    endPrdDe: z.string().optional(),
    recentPeriods: z.number().int().optional(),
    label: z.string(),
    requiresTimeSeries: z.boolean(),
  }),
  datasets: z.array(plannerDatasetSchema),
});

const plannerExecutionSchema = z.object({
  datasetId: z.string(),
  lane: z.enum(["table-search", "indicator-search", "catalog-browse"]),
  requirement: z.enum(["required", "optional"]),
  label: z.string(),
  seedQuestion: z.string(),
  status: z.enum(["ok", "empty", "error", "skipped"]),
  resultCount: z.number().int(),
  selectedKeys: z.array(z.string()),
  notes: z.array(z.string()),
});

const cacheStatusSchema = z.enum([
  "fresh-hit",
  "expired-revalidate-success",
  "expired-revalidate-failed-stale-used",
  "miss",
  "bypass",
]);

const providerAttemptSchema = z.object({
  provider: z.string(),
  strategy: z.string(),
  cacheStatus: cacheStatusSchema,
  outcome: z.enum(["ok", "empty", "error", "stale-ok"]),
  rowCount: z.number().int(),
  notes: z.array(z.string()),
  errorType: z.enum(["404", "no-data", "other"]).optional(),
  errorClass: z
    .enum([
      "fatal-auth",
      "fatal-request",
      "recoverable-empty",
      "recoverable-shape",
      "recoverable-quota",
      "recoverable-server",
      "unknown",
    ])
    .optional(),
});

const previewGuideValueSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const previewGuideSchema = z.object({
  itemOptions: z.array(previewGuideValueSchema),
  dimensions: z.array(
    z.object({
      objId: z.string(),
      name: z.string(),
      order: z.number().int(),
      values: z.array(previewGuideValueSchema),
    }),
  ),
});

const tableBundleSchema = z.object({
  table: z.object({
    tableKey: z.string(),
    orgId: z.string(),
    tblId: z.string(),
    statId: z.string().optional(),
    title: z.string(),
    organization: z.string().optional(),
    survey: z.string().optional(),
    period: z.string().optional(),
  }),
  dataPreview: z.array(z.record(z.unknown())),
  meta: z.object({
    table: z.array(z.record(z.unknown())),
    organization: z.array(z.record(z.unknown())),
    period: z.array(z.record(z.unknown())),
    items: z.array(z.record(z.unknown())),
    comments: z.array(z.record(z.unknown())),
    units: z.array(z.record(z.unknown())),
    source: z.array(z.record(z.unknown())),
    updatedAt: z.array(z.record(z.unknown())),
    weights: z.array(z.record(z.unknown())),
  }),
  explanation: z.record(z.unknown()).nullable(),
  warnings: z.array(z.string()),
  units: z.array(z.string()),
  dimensions: z.array(z.string()),
  coverage: z.object({
    periods: z.array(z.string()),
    lastUpdated: z.string().optional(),
  }),
  previewGuide: previewGuideSchema,
  previewRequest: z.object({
    itemId: z.string(),
    prdSe: z.string(),
    attempts: z.array(z.record(z.string())),
  }),
  comparisonReadiness: z.enum(["high", "medium", "low"]),
  provenance: z.object({
    cacheStatus: cacheStatusSchema,
    metaSources: z.array(
      z.object({
        type: z.enum(["TBL", "ORG", "PRD", "ITM", "CMMT", "UNIT", "SOURCE", "NCD", "WGT"]),
        rowCount: z.number().int(),
        status: z.enum(["ok", "empty"]),
      }),
    ),
    explanationSource: z.enum(["statId", "orgTbl", "none"]),
    previewSource: z.enum(["openapi", "html-fallback", "none"]),
    previewAttempts: z.array(
      providerAttemptSchema.extend({
        itemId: z.string(),
        prdSe: z.string(),
        attemptIndex: z.number().int(),
      }),
    ),
    previewParameters: z.object({
      itemId: z.string(),
      prdSe: z.string(),
      attempts: z.array(z.record(z.string())),
      weightParams: z.record(z.string()).optional(),
    }),
  }),
});

const indicatorBundleSchema = z.object({
  indicator: z.object({
    indicatorId: z.string().optional(),
    indicatorName: z.string(),
    unit: z.string().optional(),
    sourceQuery: z.string().optional(),
  }),
  explanation: z.record(z.unknown()).nullable(),
  listMatches: z.array(z.record(z.unknown())),
  detailRows: z.array(z.record(z.unknown())),
  warnings: z.array(z.string()),
  coverage: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
    latest: z.string().optional(),
    prdSe: z.string().optional(),
    prdSeName: z.string().optional(),
  }),
  provenance: z.object({
    cacheStatus: cacheStatusSchema,
    explanationSource: z.enum(["indicatorId", "indicatorName", "none"]),
    detailSource: z.enum(["indicatorId", "indicatorName", "none"]),
    listSource: z.enum(["indicatorId", "indicatorName", "none"]),
    lookupAttempts: z.array(
      providerAttemptSchema.extend({
        query: z.string(),
      }),
    ),
  }),
});

const answerBundleSchema = z.object({
  interpretedIntent: z.object({
    question: z.string(),
    keywords: z.array(z.string()),
    queryPlan: z.array(queryPlanItemSchema),
  }),
  planner: plannerSchema,
  summary: z.object({
    headline: z.string(),
    takeaway: z.string(),
    recommendedFocus: z.string().optional(),
  }),
  selectedTables: z.array(
    z.object({
      tableKey: z.string(),
      orgId: z.string(),
      tblId: z.string(),
      statId: z.string().optional(),
      title: z.string(),
      organization: z.string().optional(),
      survey: z.string().optional(),
      period: z.string().optional(),
      whyMatched: z.array(z.string()),
      score: z.number(),
      warnings: z.array(z.string()),
      previewRows: z.number().int(),
      previewRequest: z.object({
        itemId: z.string(),
        prdSe: z.string(),
        attempts: z.array(z.record(z.string())),
      }),
      autoSelections: z
        .object({
          dimensionSelections: z
            .record(z.union([z.string(), z.array(z.string())]))
            .optional(),
          itemSelection: z.string().optional(),
          newEstPrdCnt: z.number().int().optional(),
          startPrdDe: z.string().optional(),
          endPrdDe: z.string().optional(),
        })
        .optional(),
    }),
  ),
  selectedIndicators: z.array(
    z.object({
      indicatorId: z.string().optional(),
      indicatorName: z.string(),
      unit: z.string().optional(),
      sourceQuery: z.string().optional(),
      whyMatched: z.array(z.string()),
      score: z.number(),
      warnings: z.array(z.string()),
      detailRows: z.number().int(),
      coverage: z.object({
        start: z.string().optional(),
        end: z.string().optional(),
        latest: z.string().optional(),
        prdSe: z.string().optional(),
        prdSeName: z.string().optional(),
      }),
      matchedQueries: z.array(z.string()),
      matchedStrategies: z.array(z.string()),
    }),
  ),
  selectedCatalogs: z.array(
    z.object({
      catalogKey: z.string(),
      vwCd: z.string(),
      viewName: z.string(),
      listId: z.string().optional(),
      listName: z.string().optional(),
      orgId: z.string().optional(),
      tblId: z.string().optional(),
      tblNm: z.string().optional(),
      score: z.number(),
      whyMatched: z.array(z.string()),
      depth: z.number().int(),
    }),
  ),
  comparison: z
    .object({
      tables: z.array(
        z.object({
          tableKey: z.string(),
          title: z.string(),
          organization: z.string().optional(),
          units: z.array(z.string()),
          periods: z.array(z.string()),
          dimensionCount: z.number().int(),
          previewRows: z.number().int(),
          readiness: z.string(),
          warnings: z.array(z.string()),
        }),
      ),
      summary: z.object({
        tableCount: z.number().int(),
        comparable: z.boolean(),
        sharedUnitCount: z.number().int(),
        sharedDimensionCount: z.number().int(),
        sharedPeriodCount: z.number().int(),
      }),
      commonDimensions: z.array(z.string()),
      comparisonMatrix: z.array(z.record(z.unknown())),
      keyDifferences: z.array(z.string()),
      warnings: z.array(z.string()),
      analysisHints: z.array(z.string()),
      evidence: z.array(z.string()),
    })
    .nullable(),
  nextQuestions: z.array(z.string()),
  evidence: z.array(z.string()),
  provenance: z.object({
    plannerExecutions: z.array(plannerExecutionSchema),
    lanes: z.array(
      z.object({
        lane: z.enum(["table-search", "indicator-search", "catalog-browse"]),
        enabled: z.boolean(),
        queryPlan: z.array(queryPlanItemSchema),
        resultCount: z.number().int(),
        attemptCount: z.number().int(),
        okCount: z.number().int(),
        emptyCount: z.number().int(),
        errorCount: z.number().int(),
        error404Count: z.number().int(),
        topStrategies: z.array(z.string()),
      }),
    ),
    selectedTables: z.array(
      z.object({
        tableKey: z.string(),
        previewSource: z.enum(["openapi", "html-fallback", "none"]),
        explanationSource: z.enum(["statId", "orgTbl", "none"]),
        metaTypes: z.array(z.string()),
        weightRowCount: z.number().int(),
      }),
    ),
    selectedIndicators: z.array(
      z.object({
        indicatorId: z.string().optional(),
        indicatorName: z.string(),
        explanationSource: z.enum(["indicatorId", "indicatorName", "none"]),
        detailSource: z.enum(["indicatorId", "indicatorName", "none"]),
        matchedQueries: z.array(z.string()),
        matchedStrategies: z.array(z.string()),
      }),
    ),
    selectedCatalogs: z.array(
      z.object({
        catalogKey: z.string(),
        vwCd: z.string(),
        depth: z.number().int(),
      }),
    ),
  }),
});

function createServer(service: KosisService): McpServer {
  const server = new McpServer({
    name: "kosis-question-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "kosis_plan_question",
    {
      title: "KOSIS Question Planner",
      description:
        "Turn a general question into a KOSIS execution plan with indicator candidates, comparison axes, period intent, and required/optional dataset fallbacks.",
      inputSchema: {
        question: z.string().min(2),
        searchHints: z.array(z.string().min(1)).optional(),
      },
      outputSchema: plannerSchema,
    },
    async ({ question, searchHints }) =>
      asToolResult(service.planQuestion(question, searchHints)),
  );

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
        cacheStatus: cacheStatusSchema,
        queryPlan: z.array(
          z.object({
            query: z.string(),
            reason: z.string(),
          }),
        ),
        attempts: z.array(
          providerAttemptSchema.extend({
            query: z.string(),
            parentListId: z.string().optional(),
            depth: z.number().int().optional(),
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
    "kosis_search_indicators",
    {
      title: "KOSIS Indicator Search",
      description:
        "Break a natural-language question into KOSIS indicator queries and return ranked related indicators.",
      inputSchema: {
        question: z.string().min(2),
        searchHints: z.array(z.string().min(1)).optional(),
        limit: z.number().int().min(1).max(20).optional(),
      },
      outputSchema: {
        cacheStatus: cacheStatusSchema,
        queryPlan: z.array(
          z.object({
            query: z.string(),
            reason: z.string(),
          }),
        ),
        attempts: z.array(
          providerAttemptSchema.extend({
            query: z.string(),
          }),
        ),
        results: z.array(
          z.object({
            indicatorKey: z.string(),
            indicatorId: z.string().optional(),
            indicatorName: z.string(),
            unit: z.string().optional(),
            period: z.object({
              start: z.string().optional(),
              end: z.string().optional(),
              latest: z.string().optional(),
              prdSeName: z.string().optional(),
            }),
            score: z.number(),
            whyMatched: z.array(z.string()),
            matchedQueries: z.array(z.string()),
            matchedStrategies: z.array(z.string()),
            raw: z.record(z.unknown()),
          }),
        ),
      },
    },
    async ({ question, searchHints, limit }) =>
      asToolResult(await service.searchIndicators(question, searchHints, limit)),
  );

  server.registerTool(
    "kosis_browse_catalog",
    {
      title: "KOSIS Catalog Browse",
      description:
        "Browse KOSIS catalog views such as topic or organization trees and return ranked related list/table candidates.",
      inputSchema: {
        question: z.string().min(2),
        searchHints: z.array(z.string().min(1)).optional(),
        limit: z.number().int().min(1).max(20).optional(),
      },
      outputSchema: {
        cacheStatus: cacheStatusSchema,
        queryPlan: z.array(
          z.object({
            query: z.string(),
            reason: z.string(),
          }),
        ),
        exploredViews: z.array(
          z.object({
            vwCd: z.string(),
            name: z.string(),
            parentListId: z.string(),
          }),
        ),
        attempts: z.array(
          providerAttemptSchema.extend({
            query: z.string(),
            parentListId: z.string().optional(),
            depth: z.number().int().optional(),
          }),
        ),
        results: z.array(
          z.object({
            catalogKey: z.string(),
            vwCd: z.string(),
            viewName: z.string(),
            listId: z.string().optional(),
            listName: z.string().optional(),
            orgId: z.string().optional(),
            tblId: z.string().optional(),
            tblNm: z.string().optional(),
            statId: z.string().optional(),
            score: z.number(),
            whyMatched: z.array(z.string()),
            depth: z.number().int(),
            raw: z.record(z.unknown()),
          }),
        ),
      },
    },
    async ({ question, searchHints, limit }) =>
      asToolResult(await service.browseCatalog(question, searchHints, limit)),
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
      outputSchema: tableBundleSchema,
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
    "kosis_get_indicator_bundle",
    {
      title: "KOSIS Indicator Bundle",
      description:
        "Fetch a KOSIS indicator bundle including description, list context, and detail rows.",
      inputSchema: {
        indicatorId: z.string().min(1).optional(),
        indicatorName: z.string().min(1).optional(),
        startPrdDe: z.string().min(1).optional(),
        endPrdDe: z.string().min(1).optional(),
        rn: z.number().int().min(1).optional(),
        srvRn: z.number().int().min(1).max(24).optional(),
      },
      outputSchema: indicatorBundleSchema,
    },
    async ({ indicatorId, indicatorName, startPrdDe, endPrdDe, rn, srvRn }) =>
      asToolResult(
        await service.getIndicatorBundle({
          indicatorId,
          indicatorName,
          startPrdDe,
          endPrdDe,
          rn,
          srvRn,
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
        "Take a natural-language question, find related KOSIS tables and indicators, bundle evidence, and optionally compare tables.",
      inputSchema: {
        question: z.string().min(2),
        limit: z.number().int().min(1).max(10).optional(),
        comparisonMode: z.enum(["auto", "none", "pairwise"]).optional(),
        searchHints: z.array(z.string().min(1)).optional(),
      },
      outputSchema: answerBundleSchema,
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

function extractUserApiKey(req: any): string | undefined {
  const headerValue = req.header("x-kosis-api-key");
  if (headerValue) {
    return headerValue;
  }

  const queryValue = req.query?.oc;
  if (typeof queryValue === "string" && queryValue.trim()) {
    return queryValue.trim();
  }

  return undefined;
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
  const cache = new FileCache(config.cacheDir, config.cacheTtlMs);
  if (config.clearCacheOnStart) {
    await cache.clearAll();
  }

  const app = createMcpExpressApp({ host: config.host });

  app.get("/healthz", (_req: any, res: any) => {
    res.status(200).json({ ok: true });
  });

  app.post("/mcp", async (req: any, res: any) => {
    if (config.serverToken) {
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
    }

    const userApiKey = extractUserApiKey(req);
    if (!userApiKey) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32602,
          message: "Missing KOSIS API key. Provide X-Kosis-Api-Key header or ?oc= query parameter.",
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
