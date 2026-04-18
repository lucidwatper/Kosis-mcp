import { z } from "zod";

export const queryPlanItemSchema = z.object({
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

export const plannerSchema = z.object({
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
  queryPlan: z.array(queryPlanItemSchema),
  status: z.enum(["ok", "empty", "error", "skipped"]),
  resultCount: z.number().int(),
  attemptCount: z.number().int(),
  okCount: z.number().int(),
  emptyCount: z.number().int(),
  errorCount: z.number().int(),
  selectedKeys: z.array(z.string()),
  notes: z.array(z.string()),
  failureReasons: z.array(z.string()),
});

export const cacheStatusSchema = z.enum([
  "fresh-hit",
  "expired-revalidate-success",
  "expired-revalidate-failed-stale-used",
  "miss",
  "bypass",
]);

export const providerAttemptSchema = z.object({
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

export const tableBundleSchema = z.object({
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

export const indicatorBundleSchema = z.object({
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

export const answerBundleSchema = z.object({
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
