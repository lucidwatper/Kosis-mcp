import { KosisApiError } from "./errors.js";
import type {
  BrowseCatalogResult,
  CacheStatus,
  CatalogResult,
  CatalogView,
  IndicatorBundle,
  IndicatorSearchAttemptLog,
  JsonRecord,
  KosisTableBundle,
  NormalizedIndicatorResult,
  NormalizedSearchResult,
  ProviderAttemptLog,
  QueryIntent,
  QueryPlanItem,
  SearchAttemptLog,
  SearchIndicatorsResult,
  SearchTopicsResult,
} from "./types.js";
import { readString, tableKey, textFromRecord, uniqueStrings } from "./utils.js";

export interface IndicatorSearchAttempt {
  query: string;
  strategy:
    | "list-exact"
    | "explain-exact"
    | "detail-exact"
    | "list-sanitized"
    | "explain-sanitized"
    | "detail-sanitized"
    | "id-explain"
    | "id-detail";
}

export interface TableSearchAttempt {
  query: string;
  strategy:
    | "exact-plan"
    | "sanitized-query"
    | "measure-focused"
    | "domain-focused"
    | "suffix-boost";
}

export interface CatalogSearchAttempt {
  query: string;
  strategy:
    | "primary-depth1"
    | "primary-depth2"
    | "alternate-depth1"
    | "alternate-depth2"
    | "keyword-focused";
  depthLimit: number;
  views: CatalogView[];
}

export const DEFAULT_CATALOG_VIEWS: CatalogView[] = [
  { vwCd: "MT_ZTITLE", name: "주제별 통계", parentListId: "A" },
  { vwCd: "MT_OTITLE", name: "기관별 통계", parentListId: "A" },
  { vwCd: "MT_ATITLE01", name: "지역통계(주제별)", parentListId: "A" },
  { vwCd: "MT_ATITLE02", name: "지역통계(기관별)", parentListId: "A" },
  { vwCd: "MT_GTITLE01", name: "e-지방지표", parentListId: "A" },
  { vwCd: "MT_ETITLE", name: "영문 KOSIS", parentListId: "A" },
];

export function classifyKosisError(error: unknown): {
  errorType?: "404" | "no-data" | "other";
  errorClass: SearchAttemptLog["errorClass"];
  shouldFallback: boolean;
  note: string;
} {
  if (!(error instanceof KosisApiError)) {
    return {
      errorType: "other",
      errorClass: "unknown",
      shouldFallback: false,
      note: "비KOSIS 오류라서 즉시 중단 대상입니다.",
    };
  }

  if (error.code === "10" || error.code === "11") {
    return {
      errorType: "other",
      errorClass: "fatal-auth",
      shouldFallback: false,
      note: "인증 오류라서 다른 후보로 내려가지 않습니다.",
    };
  }

  if (
    error.code === "20" ||
    error.code === "21" ||
    error.code === "22" ||
    error.message.includes("필수요청변수값이 누락") ||
    error.message.includes("필수요청변수") ||
    error.message.includes("잘못된 요청변수") ||
    error.message.includes("허용되지 않은 파라미터")
  ) {
    return {
      errorType: "other",
      errorClass: "fatal-request",
      shouldFallback: true,
      note: "요청 파라미터 조합이 맞지 않아 다음 전략으로 축소합니다.",
    };
  }

  if (error.code === "30" || error.message.includes("데이터가 존재하지 않습니다")) {
    return {
      errorType: "no-data",
      errorClass: "recoverable-empty",
      shouldFallback: true,
      note: "조회 결과 없음이라 다음 후보로 내려갑니다.",
    };
  }

  if (error.code === "31" || error.code === "41") {
    return {
      errorType: "other",
      errorClass: "recoverable-shape",
      shouldFallback: true,
      note: "결과 범위가 커서 더 좁은 후보가 필요합니다.",
    };
  }

  if (error.code === "40" || error.code === "42") {
    return {
      errorType: "other",
      errorClass: "recoverable-quota",
      shouldFallback: true,
      note: "호출 제한이 걸려 더 싼 후보나 캐시로 내려갑니다.",
    };
  }

  if (
    error.code === "50" ||
    error.message.includes("status 404") ||
    error.message.includes("사이트 변경안내") ||
    error.message.includes("non-JSON payload")
  ) {
    return {
      errorType: error.message.includes("status 404") ? "404" : "other",
      errorClass: "recoverable-server",
      shouldFallback: true,
      note: "서버/응답 형태 문제라 fallback 대상입니다.",
    };
  }

  return {
    errorType: "other",
    errorClass: "unknown",
    shouldFallback: false,
    note: "분류되지 않은 오류라 바로 surface 합니다.",
  };
}

export function shouldUseStaleBecauseOutputIsNotUsable(
  attempts: Array<ProviderAttemptLog>,
  resultCount: number,
): boolean {
  if (resultCount > 0) {
    return false;
  }

  const hadServerishError = attempts.some((attempt) =>
    ["recoverable-server", "recoverable-quota", "recoverable-shape"].includes(
      attempt.errorClass ?? "",
    ),
  );
  const hadOkAttempt = attempts.some((attempt) => attempt.outcome === "ok");
  return hadServerishError && !hadOkAttempt;
}

export function appendBudgetStopNote<T extends ProviderAttemptLog>(
  attempts: T[],
  input: {
    provider: string;
    strategy: string;
    note: string;
    query?: string;
    itemId?: string;
    prdSe?: string;
    attemptIndex?: number;
    parentListId?: string;
    depth?: number;
  },
): void {
  const common = {
    provider: input.provider,
    strategy: input.strategy,
    cacheStatus: "bypass" as const,
    outcome: "empty" as const,
    rowCount: 0,
    notes: [input.note],
  };

  attempts.push({
    ...common,
    ...(input.query ? { query: input.query } : {}),
    ...(input.itemId ? { itemId: input.itemId } : {}),
    ...(input.prdSe ? { prdSe: input.prdSe } : {}),
    ...(typeof input.attemptIndex === "number" ? { attemptIndex: input.attemptIndex } : {}),
    ...(input.parentListId ? { parentListId: input.parentListId } : {}),
    ...(typeof input.depth === "number" ? { depth: input.depth } : {}),
  } as T);
}

function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/대한민국|한국|국내|지난|최근|비교해줘|비교|보여줘|설명해줘|무엇인지|의미|설명자료/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildTableSearchAttempts(
  question: string,
  intent: QueryIntent,
  queryPlan: QueryPlanItem[],
): TableSearchAttempt[] {
  const exactQueries = uniqueStrings(queryPlan.map((item) => item.query)).slice(0, 6);
  const sanitizedQueries = uniqueStrings(exactQueries.map(sanitizeSearchQuery)).filter(
    (query) => query.length >= 2,
  ).slice(0, 4);
  const measureQueries = uniqueStrings([
    ...intent.measures,
    ...intent.keywords.slice(0, 2),
  ]).filter((query) => query.length >= 2).slice(0, 3);
  const domainQueries = uniqueStrings(intent.searchHints).filter((query) => query.length >= 2).slice(0, 3);
  const suffixQueries = uniqueStrings(
    [...intent.measures, ...intent.keywords.slice(0, 2)].flatMap((query) =>
      query.length >= 2 ? [`${query} 통계표`, `${query} 통계자료`] : [],
    ),
  ).slice(0, 2);

  return [
    ...exactQueries.map((query) => ({ query, strategy: "exact-plan" as const })),
    ...sanitizedQueries.map((query) => ({ query, strategy: "sanitized-query" as const })),
    ...measureQueries.map((query) => ({ query, strategy: "measure-focused" as const })),
    ...domainQueries.map((query) => ({ query, strategy: "domain-focused" as const })),
    ...suffixQueries.map((query) => ({ query, strategy: "suffix-boost" as const })),
  ];
}

function alternateCatalogViews(primaryViews: CatalogView[]): CatalogView[] {
  const primaryCodes = new Set(primaryViews.map((view) => view.vwCd));
  return DEFAULT_CATALOG_VIEWS.filter((view) => !primaryCodes.has(view.vwCd));
}

export function buildCatalogSearchAttempts(
  question: string,
  intent: QueryIntent,
  queryPlan: QueryPlanItem[],
  selectCatalogViews: (question: string, intent: QueryIntent) => CatalogView[],
): CatalogSearchAttempt[] {
  const primaryViews = selectCatalogViews(question, intent);
  const alternateViews = alternateCatalogViews(primaryViews);
  const exactQuery = queryPlan[0]?.query ?? question;
  const sanitizedQuery = sanitizeSearchQuery(exactQuery) || exactQuery;
  const keywordQuery = intent.keywords[0] ?? sanitizedQuery;

  return [
    { query: exactQuery, strategy: "primary-depth1", depthLimit: 1, views: primaryViews },
    { query: exactQuery, strategy: "primary-depth2", depthLimit: 2, views: primaryViews },
    { query: sanitizedQuery, strategy: "alternate-depth1", depthLimit: 1, views: alternateViews },
    {
      query: keywordQuery,
      strategy: "keyword-focused",
      depthLimit: intent.primaryIntent === "browse" ? 2 : 1,
      views: primaryViews,
    },
  ];
}

function sanitizeIndicatorQuery(query: string): string {
  return query
    .replace(/대한민국|한국|국내/g, "")
    .replace(/최근|추이|설명자료|설명|의미|수치|값|통계표|통계자료|지표|시계열/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildIndicatorAttempts(
  question: string,
  intent: QueryIntent,
  queryPlan: QueryPlanItem[],
  exactLimit: number,
  sanitizedLimit: number,
): IndicatorSearchAttempt[] {
  const exactQueries = uniqueStrings(queryPlan.map((item) => item.query)).slice(
    0,
    exactLimit,
  );
  const sanitizedQueries = uniqueStrings([
    ...exactQueries.map(sanitizeIndicatorQuery),
    ...intent.measures,
    ...intent.keywords.filter((keyword) => keyword.length >= 2),
    sanitizeIndicatorQuery(question),
  ]).filter((query) => query.length >= 2).slice(0, sanitizedLimit);

  const attempts: IndicatorSearchAttempt[] = [];
  for (const query of exactQueries) {
    attempts.push({ query, strategy: "list-exact" });
    attempts.push({ query, strategy: "explain-exact" });
    attempts.push({ query, strategy: "detail-exact" });
  }
  for (const query of sanitizedQueries) {
    attempts.push({ query, strategy: "list-sanitized" });
    attempts.push({ query, strategy: "explain-sanitized" });
    attempts.push({ query, strategy: "detail-sanitized" });
  }

  return attempts;
}

export function chooseBestIndicatorRecord(
  records: JsonRecord[],
  nameHint?: string,
): JsonRecord | null {
  if (records.length === 0) {
    return null;
  }

  const normalizedHint = nameHint?.replace(/\s+/g, "").toLowerCase();
  const loweredHint = nameHint?.toLowerCase();
  if (!normalizedHint || !loweredHint) {
    return records[0];
  }

  const exact = records.find((record) => {
    const name = (readString(record, "statJipyoNm") ?? "")
      .replace(/\s+/g, "")
      .toLowerCase();
    return name === normalizedHint;
  });
  if (exact) {
    return exact;
  }

  const partial = records.find((record) => {
    const name = (readString(record, "statJipyoNm") ?? "").toLowerCase();
    return name.includes(loweredHint);
  });
  return partial ?? records[0];
}

export function buildIndicatorCoverage(
  listMatches: JsonRecord[],
  detailRows: JsonRecord[],
): IndicatorBundle["coverage"] {
  const firstList = listMatches[0] ?? {};
  const firstDetail = detailRows[0] ?? {};
  const lastDetail = detailRows.at(-1) ?? {};

  return {
    start:
      readString(firstList, "strtPrdDe") ??
      readString(firstDetail, "prdDe"),
    end:
      readString(firstList, "endPrdDe") ??
      readString(lastDetail, "prdDe"),
    latest:
      readString(firstList, "prdDe") ??
      readString(lastDetail, "prdDe"),
    prdSe:
      readString(firstDetail, "prdSe"),
    prdSeName: readString(firstList, "prdSeName"),
  };
}

export function buildIndicatorIdentity(
  indicatorId: string | undefined,
  indicatorName: string,
  listMatches: JsonRecord[],
  detailRows: JsonRecord[],
  sourceQuery?: string,
): IndicatorBundle["indicator"] {
  return {
    indicatorId,
    indicatorName,
    unit:
      readString(detailRows[0] ?? {}, "unit") ??
      readString(listMatches[0] ?? {}, "unit"),
    sourceQuery,
  };
}

export function firstUsableRecord(rows: JsonRecord[]): JsonRecord | null {
  return rows.find((row) => Object.keys(row).length > 0) ?? null;
}

function mergeCacheStatus(statuses: CacheStatus[]): CacheStatus {
  return (
    statuses.find((status) => status === "expired-revalidate-failed-stale-used") ??
    statuses.find((status) => status === "fresh-hit") ??
    statuses.find((status) => status === "expired-revalidate-success") ??
    statuses.find((status) => status === "miss") ??
    "bypass"
  );
}

export function mergeQueryPlanItems(groups: QueryPlanItem[][]): QueryPlanItem[] {
  const merged = new Map<string, QueryPlanItem>();

  for (const group of groups) {
    for (const item of group) {
      const key = `${item.query}::${item.reason}`;
      if (!merged.has(key)) {
        merged.set(key, item);
      }
    }
  }

  return [...merged.values()];
}

export function mergeTopicSearchResults(searches: SearchTopicsResult[]): SearchTopicsResult {
  const aggregate = new Map<string, NormalizedSearchResult>();

  for (const search of searches) {
    for (const result of search.results) {
      const current = aggregate.get(result.tableKey);
      if (!current || current.score < result.score) {
        aggregate.set(result.tableKey, { ...result });
        continue;
      }

      current.score += 2;
      current.whyMatched = uniqueStrings([...current.whyMatched, ...result.whyMatched]);
      current.raw = { ...current.raw, ...result.raw };
    }
  }

  return {
    cacheStatus: mergeCacheStatus(searches.map((search) => search.cacheStatus)),
    queryPlan: mergeQueryPlanItems(searches.map((search) => search.queryPlan)),
    attempts: searches.flatMap((search) => search.attempts),
    results: [...aggregate.values()].sort((left, right) => right.score - left.score),
  };
}

export function mergeIndicatorSearchResults(
  searches: SearchIndicatorsResult[],
): SearchIndicatorsResult {
  const aggregate = new Map<string, NormalizedIndicatorResult>();

  for (const search of searches) {
    for (const result of search.results) {
      const current = aggregate.get(result.indicatorKey);
      if (!current || current.score < result.score) {
        aggregate.set(result.indicatorKey, { ...result });
        continue;
      }

      current.score += 2;
      current.whyMatched = uniqueStrings([...current.whyMatched, ...result.whyMatched]);
      current.matchedQueries = uniqueStrings([
        ...current.matchedQueries,
        ...result.matchedQueries,
      ]);
      current.matchedStrategies = uniqueStrings([
        ...current.matchedStrategies,
        ...result.matchedStrategies,
      ]);
      current.raw = { ...current.raw, ...result.raw };
    }
  }

  return {
    cacheStatus: mergeCacheStatus(searches.map((search) => search.cacheStatus)),
    queryPlan: mergeQueryPlanItems(searches.map((search) => search.queryPlan)),
    attempts: searches.flatMap((search) => search.attempts),
    results: [...aggregate.values()].sort((left, right) => right.score - left.score),
  };
}

export function mergeCatalogResults(searches: BrowseCatalogResult): BrowseCatalogResult;
export function mergeCatalogResults(searches: BrowseCatalogResult[]): BrowseCatalogResult;
export function mergeCatalogResults(
  searches: BrowseCatalogResult | BrowseCatalogResult[],
): BrowseCatalogResult {
  const entries = Array.isArray(searches) ? searches : [searches];
  const aggregate = new Map<string, CatalogResult>();

  for (const search of entries) {
    for (const result of search.results) {
      const current = aggregate.get(result.catalogKey);
      if (!current || current.score < result.score) {
        aggregate.set(result.catalogKey, { ...result });
        continue;
      }

      current.score += 2;
      current.whyMatched = uniqueStrings([...current.whyMatched, ...result.whyMatched]);
      current.raw = { ...current.raw, ...result.raw };
    }
  }

  return {
    cacheStatus: mergeCacheStatus(entries.map((search) => search.cacheStatus)),
    queryPlan: mergeQueryPlanItems(entries.map((search) => search.queryPlan)),
    exploredViews: uniqueStrings(
      entries.flatMap((search) =>
        search.exploredViews.map((view) => `${view.vwCd}::${view.name}::${view.parentListId}`),
      ),
    ).map((entry) => {
      const [vwCd, name, parentListId] = entry.split("::");
      return { vwCd, name, parentListId };
    }),
    attempts: entries.flatMap((search) => search.attempts),
    results: [...aggregate.values()].sort((left, right) => right.score - left.score),
  };
}

export function summarizeIndicatorAttempts(
  attempts: IndicatorSearchAttemptLog[],
): {
  lane: "indicator-search";
  enabled: true;
  queryPlan: QueryPlanItem[];
  resultCount: number;
  attemptCount: number;
  okCount: number;
  emptyCount: number;
  errorCount: number;
  error404Count: number;
  topStrategies: string[];
} {
  const okCount = attempts.filter((attempt) => attempt.outcome === "ok").length;
  const emptyCount = attempts.filter((attempt) => attempt.outcome === "empty").length;
  const errorAttempts = attempts.filter((attempt) => attempt.outcome === "error");
  const strategyCounts = new Map<string, number>();

  for (const attempt of attempts) {
    strategyCounts.set(
      attempt.strategy,
      (strategyCounts.get(attempt.strategy) ?? 0) + 1,
    );
  }

  const topStrategies = [...strategyCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([strategy]) => strategy);

  return {
    lane: "indicator-search",
    enabled: true,
    queryPlan: [],
    resultCount: 0,
    attemptCount: attempts.length,
    okCount,
    emptyCount,
    errorCount: errorAttempts.length,
    error404Count: errorAttempts.filter((attempt) => attempt.errorType === "404").length,
    topStrategies,
  };
}

export function summaryRow(bundle: KosisTableBundle) {
  return {
    tableKey: bundle.table.tableKey,
    title: bundle.table.title,
    organization: bundle.table.organization,
    units: bundle.units,
    periods: bundle.coverage.periods,
    dimensionCount: bundle.dimensions.length,
    previewRows: bundle.dataPreview.length,
    readiness: bundle.comparisonReadiness,
    warnings: bundle.warnings,
  };
}

export function intersectStrings(groups: string[][]): string[] {
  if (groups.length === 0) {
    return [];
  }

  return groups
    .reduce((accumulator, current) =>
      accumulator.filter((value) => current.includes(value)),
    )
    .filter(Boolean);
}

export function buildValueComparisonEvidence(
  bundles: KosisTableBundle[],
): string[] {
  return uniqueStrings([
    ...bundles.flatMap((bundle) => bundle.warnings),
    ...bundles.flatMap((bundle) =>
      bundle.dataPreview.slice(0, 3).map((row) => textFromRecord(row)),
    ),
  ]);
}

export function catalogKeyFromRecord(view: CatalogView, record: JsonRecord): string | null {
  const listId = readString(record, "LIST_ID");
  const orgId = readString(record, "ORG_ID");
  const tblId = readString(record, "TBL_ID");
  if (orgId && tblId) {
    return `${view.vwCd}:tbl:${tableKey(orgId, tblId)}`;
  }
  if (listId) {
    return `${view.vwCd}:list:${listId}`;
  }
  return null;
}
