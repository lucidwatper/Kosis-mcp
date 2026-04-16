export type JsonRecord = Record<string, unknown>;

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

export interface DataPreviewRow extends JsonRecord {
  tableKey: string;
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
  startPrdDe?: string;
  endPrdDe?: string;
}

export interface QueryIntent {
  question: string;
  keywords: string[];
  measures: string[];
  searchHints: string[];
  preferredPrdSe?: "Y" | "M" | "Q" | "S" | "W" | "D";
  startPrdDe?: string;
  endPrdDe?: string;
  recentPeriods?: number;
  geographyScope: "national" | "regional" | "global" | "unspecified";
  sexSelection?: "남자" | "여자" | "계";
  ageSelection?: string;
  comparison: boolean;
  wantsExplanation: boolean;
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
  queryPlan: QueryPlanItem[];
  results: NormalizedSearchResult[];
}

export interface AnswerBundle {
  interpretedIntent: {
    question: string;
    keywords: string[];
    queryPlan: QueryPlanItem[];
  };
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
  comparison: ComparisonResult | null;
  nextQuestions: string[];
  evidence: string[];
}
