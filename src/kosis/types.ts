export type JsonRecord = Record<string, unknown>;

export type CacheStatus =
  | "fresh-hit"
  | "expired-revalidate-success"
  | "expired-revalidate-failed-stale-used"
  | "miss"
  | "bypass";

export type AttemptErrorClass =
  | "fatal-auth"
  | "fatal-request"
  | "recoverable-empty"
  | "recoverable-shape"
  | "recoverable-quota"
  | "recoverable-server"
  | "unknown";

export interface QueryPlanItem {
  query: string;
  reason: string;
}

export interface NormalizedSearchResult {
  tableKey: string;
  orgId: string;
  tblId: string;
  statId?: string;
  tblNm: string;
  statNm?: string;
  organization?: string;
  period: {
    start?: string;
    end?: string;
  };
  path?: string;
  score: number;
  whyMatched: string[];
  raw: JsonRecord;
}

export interface ProviderAttemptLog {
  provider: string;
  strategy: string;
  cacheStatus: CacheStatus;
  outcome: "ok" | "empty" | "error" | "stale-ok";
  rowCount: number;
  notes: string[];
  errorType?: "404" | "no-data" | "other";
  errorClass?: AttemptErrorClass;
}

export interface SearchAttemptLog extends ProviderAttemptLog {
  query: string;
  parentListId?: string;
  depth?: number;
}

export interface PreviewAttemptLog extends ProviderAttemptLog {
  itemId: string;
  prdSe: string;
  attemptIndex: number;
}

export interface DataPreviewRow extends JsonRecord {
  tableKey: string;
}

export interface HtmlPreviewResult {
  rows: DataPreviewRow[];
  periodCode: string;
  periods: string[];
}

export interface KosisMetaBundle {
  table: JsonRecord[];
  organization: JsonRecord[];
  period: JsonRecord[];
  items: JsonRecord[];
  comments: JsonRecord[];
  units: JsonRecord[];
  source: JsonRecord[];
  updatedAt: JsonRecord[];
  weights: JsonRecord[];
}

export interface PreviewDimensionValue {
  id: string;
  name: string;
}

export interface PreviewDimensionGuide {
  objId: string;
  name: string;
  order: number;
  values: PreviewDimensionValue[];
}

export interface PreviewGuide {
  itemOptions: PreviewDimensionValue[];
  dimensions: PreviewDimensionGuide[];
}

export interface PreviewRequestOptions {
  dimensionSelections?: Record<string, string | string[]>;
  itemSelection?: string;
  newEstPrdCnt?: number;
  preferredPrdSe?: "Y" | "M" | "Q" | "S" | "W" | "D";
  startPrdDe?: string;
  endPrdDe?: string;
}

export interface IntentTarget {
  label: string;
  keywords: string[];
  regionTerms: string[];
  sexTerms: string[];
  ageTerms: string[];
}

export interface QueryIntent {
  question: string;
  keywords: string[];
  measures: string[];
  focusTerms: string[];
  searchHints: string[];
  targets: IntentTarget[];
  comparisonAxes: Array<"sex" | "age" | "region">;
  operationTerms: string[];
  primaryIntent:
    | "search"
    | "browse"
    | "explain"
    | "compare"
    | "value"
    | "trend";
  preferredPrdSe?: "Y" | "M" | "Q" | "S" | "W" | "D";
  startPrdDe?: string;
  endPrdDe?: string;
  recentPeriods?: number;
  geographyScope: "national" | "regional" | "global" | "unspecified";
  sexSelection?: "남자" | "여자" | "계";
  ageSelection?: string;
  comparison: boolean;
  wantsExplanation: boolean;
  wantsIndicators: boolean;
  requiresTimeSeries: boolean;
}

export interface TableIdentity {
  tableKey: string;
  orgId: string;
  tblId: string;
  statId?: string;
  title: string;
  organization?: string;
  survey?: string;
  period?: string;
}

export interface KosisTableBundle {
  table: TableIdentity;
  dataPreview: DataPreviewRow[];
  meta: KosisMetaBundle;
  explanation: JsonRecord | null;
  warnings: string[];
  units: string[];
  dimensions: string[];
  coverage: {
    periods: string[];
    lastUpdated?: string;
  };
  previewGuide: PreviewGuide;
  previewRequest: {
    itemId: string;
    prdSe: string;
    attempts: Array<Record<string, string>>;
  };
  comparisonReadiness: "high" | "medium" | "low";
  provenance: {
    cacheStatus: CacheStatus;
    metaSources: Array<{
      type: "TBL" | "ORG" | "PRD" | "ITM" | "CMMT" | "UNIT" | "SOURCE" | "NCD" | "WGT";
      rowCount: number;
      status: "ok" | "empty";
    }>;
    explanationSource: "statId" | "orgTbl" | "none";
    previewSource: "openapi" | "html-fallback" | "none";
    previewAttempts: PreviewAttemptLog[];
    previewParameters: {
      itemId: string;
      prdSe: string;
      attempts: Array<Record<string, string>>;
      weightParams?: Record<string, string>;
    };
  };
}

export interface IndicatorIdentity {
  indicatorId?: string;
  indicatorName: string;
  unit?: string;
  sourceQuery?: string;
}

export interface NormalizedIndicatorResult {
  indicatorKey: string;
  indicatorId?: string;
  indicatorName: string;
  unit?: string;
  period: {
    start?: string;
    end?: string;
    latest?: string;
    prdSeName?: string;
  };
  score: number;
  whyMatched: string[];
  matchedQueries: string[];
  matchedStrategies: string[];
  raw: JsonRecord;
}

export interface IndicatorSearchAttemptLog extends ProviderAttemptLog {
  query: string;
}

export interface IndicatorBundle {
  indicator: IndicatorIdentity;
  explanation: JsonRecord | null;
  listMatches: JsonRecord[];
  detailRows: JsonRecord[];
  warnings: string[];
  coverage: {
    start?: string;
    end?: string;
    latest?: string;
    prdSe?: string;
    prdSeName?: string;
  };
  provenance: {
    cacheStatus: CacheStatus;
    explanationSource: "indicatorId" | "indicatorName" | "none";
    detailSource: "indicatorId" | "indicatorName" | "none";
    listSource: "indicatorId" | "indicatorName" | "none";
    lookupAttempts: IndicatorSearchAttemptLog[];
  };
}

export interface CatalogView {
  vwCd: string;
  name: string;
  parentListId: string;
}

export interface CatalogResult {
  catalogKey: string;
  vwCd: string;
  viewName: string;
  listId?: string;
  listName?: string;
  orgId?: string;
  tblId?: string;
  tblNm?: string;
  statId?: string;
  score: number;
  whyMatched: string[];
  depth: number;
  raw: JsonRecord;
}

export interface CompareTableInput {
  orgId: string;
  tblId: string;
  prdSe?: string;
}

export interface ComparisonResult {
  tables: Array<{
    tableKey: string;
    title: string;
    organization?: string;
    units: string[];
    periods: string[];
    dimensionCount: number;
    previewRows: number;
    readiness: string;
    warnings: string[];
  }>;
  summary: {
    tableCount: number;
    comparable: boolean;
    sharedUnitCount: number;
    sharedDimensionCount: number;
    sharedPeriodCount: number;
  };
  commonDimensions: string[];
  comparisonMatrix: JsonRecord[];
  keyDifferences: string[];
  warnings: string[];
  analysisHints: string[];
  evidence: string[];
}

export interface SearchTopicsResult {
  cacheStatus: CacheStatus;
  queryPlan: QueryPlanItem[];
  attempts: SearchAttemptLog[];
  results: NormalizedSearchResult[];
}

export interface SearchIndicatorsResult {
  cacheStatus: CacheStatus;
  queryPlan: QueryPlanItem[];
  attempts: IndicatorSearchAttemptLog[];
  results: NormalizedIndicatorResult[];
}

export interface BrowseCatalogResult {
  cacheStatus: CacheStatus;
  queryPlan: QueryPlanItem[];
  exploredViews: CatalogView[];
  attempts: SearchAttemptLog[];
  results: CatalogResult[];
}

export interface AnswerProvenance {
  lanes: Array<{
    lane: "table-search" | "indicator-search" | "catalog-browse";
    enabled: boolean;
    queryPlan: QueryPlanItem[];
    resultCount: number;
    attemptCount: number;
    okCount: number;
    emptyCount: number;
    errorCount: number;
    error404Count: number;
    topStrategies: string[];
  }>;
  selectedTables: Array<{
    tableKey: string;
    previewSource: KosisTableBundle["provenance"]["previewSource"];
    explanationSource: KosisTableBundle["provenance"]["explanationSource"];
    metaTypes: string[];
    weightRowCount: number;
  }>;
  selectedIndicators: Array<{
    indicatorId?: string;
    indicatorName: string;
    explanationSource: IndicatorBundle["provenance"]["explanationSource"];
    detailSource: IndicatorBundle["provenance"]["detailSource"];
    matchedQueries: string[];
    matchedStrategies: string[];
  }>;
  selectedCatalogs: Array<{
    catalogKey: string;
    vwCd: string;
    depth: number;
  }>;
}

export interface AnswerSummary {
  headline: string;
  takeaway: string;
  recommendedFocus?: string;
}

export interface AnswerBundle {
  interpretedIntent: {
    question: string;
    keywords: string[];
    queryPlan: QueryPlanItem[];
  };
  summary: AnswerSummary;
  selectedTables: Array<
    KosisTableBundle["table"] & {
      whyMatched: string[];
      score: number;
      warnings: string[];
      previewRows: number;
      previewRequest: KosisTableBundle["previewRequest"];
      autoSelections?: PreviewRequestOptions;
    }
  >;
  selectedIndicators: Array<
    IndicatorBundle["indicator"] & {
      whyMatched: string[];
      score: number;
      warnings: string[];
      detailRows: number;
      coverage: IndicatorBundle["coverage"];
      matchedQueries: string[];
      matchedStrategies: string[];
    }
  >;
  selectedCatalogs: Array<
    Pick<
      CatalogResult,
      | "catalogKey"
      | "vwCd"
      | "viewName"
      | "listId"
      | "listName"
      | "orgId"
      | "tblId"
      | "tblNm"
      | "score"
      | "whyMatched"
      | "depth"
    >
  >;
  comparison: ComparisonResult | null;
  nextQuestions: string[];
  evidence: string[];
  provenance: AnswerProvenance;
}
