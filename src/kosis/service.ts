import { FileCache } from "./cache.js";
import { KosisClient } from "./client.js";
import { KosisApiError } from "./errors.js";
import { fetchHtmlPreviewFallback } from "./html-fallback.js";
import {
  buildQueryPlan,
  normalizeSearchRecord,
  scoreSearchRecord,
} from "./relevance.js";
import type {
  AnswerBundle,
  CompareTableInput,
  ComparisonResult,
  DataPreviewRow,
  JsonRecord,
  KosisMetaBundle,
  KosisTableBundle,
  NormalizedSearchResult,
  PreviewDimensionGuide,
  PreviewGuide,
  PreviewRequestOptions,
  SearchTopicsResult,
  TableIdentity,
} from "./types.js";
import {
  readString,
  tableKey,
  textFromRecord,
  tokenizeQuestion,
  uniqueStrings,
} from "./utils.js";

interface PreviewPlan {
  itemId: string;
  prdSe: string;
  attempts: Array<Record<string, string>>;
  guide: PreviewGuide;
}

function mapPeriodCode(raw?: string): string {
  if (!raw) {
    return "Y";
  }

  const value = raw.trim().toUpperCase();
  if (["Y", "M", "Q", "S", "W", "D"].includes(value)) {
    return value;
  }

  const mapped: Record<string, string> = {
    "년": "Y",
    "연": "Y",
    "월": "M",
    "분기": "Q",
    "반기": "S",
    "주": "W",
    "일": "D",
  };

  return mapped[raw.trim()] ?? "Y";
}

function derivePreviewPlan(meta: KosisMetaBundle, preferredPrdSe?: string): PreviewPlan {
  return derivePreviewPlanWithSelections(meta, preferredPrdSe, undefined);
}

function buildPreviewGuide(meta: KosisMetaBundle): PreviewGuide {
  const itemOptions = uniqueStrings(
    meta.items
      .filter((row) => readString(row, "OBJ_ID") === "ITEM")
      .flatMap((row) => {
        const id = readString(row, "ITM_ID");
        const name = readString(row, "ITM_NM");
        return id && name ? [`${id}::${name}`] : [];
      }),
  ).map((entry) => {
    const [id, name] = entry.split("::");
    return { id, name };
  });

  const dimensionGroups = new Map<
    string,
    PreviewDimensionGuide
  >();

  for (const row of meta.items) {
    const objId = readString(row, "OBJ_ID");
    if (!objId || objId === "ITEM") {
      continue;
    }

    const order = Number.parseInt(readString(row, "OBJ_ID_SN") ?? "999", 10);
    const itmId = readString(row, "ITM_ID");
    const itmNm = readString(row, "ITM_NM");
    if (!itmId) {
      continue;
    }

    const current = dimensionGroups.get(objId) ?? {
      objId,
      name: readString(row, "OBJ_NM") ?? objId,
      order: Number.isFinite(order) ? order : 999,
      values: [],
    };
    if (itmNm) {
      current.values.push({ id: itmId, name: itmNm });
    }
    current.order = Number.isFinite(order) ? order : current.order;
    dimensionGroups.set(objId, current);
  }

  return {
    itemOptions,
    dimensions: [...dimensionGroups.values()]
      .map((dimension) => ({
        ...dimension,
        values: uniqueStrings(
          dimension.values.map((value) => `${value.id}::${value.name}`),
        )
          .map((entry) => {
            const [id, name] = entry.split("::");
            return { id, name };
          })
          .slice(0, 50),
      }))
      .sort((left, right) => left.order - right.order),
  };
}

function resolveSelectionValue(
  dimension: PreviewDimensionGuide,
  selection: string | string[] | undefined,
): string | undefined {
  if (!selection) {
    return undefined;
  }

  const candidates = Array.isArray(selection) ? selection : [selection];
  const lowered = candidates.map((value) => value.toLowerCase().trim());

  const matched = dimension.values.find((value) => {
    const id = value.id.toLowerCase();
    const name = value.name.toLowerCase();
    return lowered.some((candidate) => candidate === id || candidate === name);
  });

  return matched?.id;
}

function derivePreviewPlanWithSelections(
  meta: KosisMetaBundle,
  preferredPrdSe?: string,
  options?: PreviewRequestOptions,
): PreviewPlan {
  const guide = buildPreviewGuide(meta);
  const itemSelectionLowered = options?.itemSelection?.toLowerCase().trim();
  const itemId =
    guide.itemOptions.find((option) => {
      if (!itemSelectionLowered) {
        return false;
      }
      return (
        option.id.toLowerCase() === itemSelectionLowered ||
        option.name.toLowerCase() === itemSelectionLowered
      );
    })?.id ??
    guide.itemOptions[0]?.id ??
    "all";

  const explicitAttempt: Record<string, string> = {};
  const allAttempt: Record<string, string> = {};
  const firstValueAttempt: Record<string, string> = {};

  for (const [index, dimension] of guide.dimensions.entries()) {
    const selection =
      options?.dimensionSelections?.[dimension.objId] ??
      options?.dimensionSelections?.[dimension.name];
    const selectedId = resolveSelectionValue(dimension, selection);

    explicitAttempt[`objL${index + 1}`] = selectedId ?? "all";
    allAttempt[`objL${index + 1}`] = "all";
    firstValueAttempt[`objL${index + 1}`] = dimension.values[0]?.id ?? "all";
  }

  return {
    itemId,
    prdSe: mapPeriodCode(preferredPrdSe),
    attempts:
      guide.dimensions.length > 0
        ? [explicitAttempt, allAttempt, firstValueAttempt]
        : [{ objL1: "all" }],
    guide,
  };
}

function normalizeUnits(meta: KosisMetaBundle, preview: DataPreviewRow[]): string[] {
  return uniqueStrings([
    ...meta.units.map((row) => readString(row, "UNIT_NM") ?? readString(row, "UNIT_NM_ENG")),
    ...meta.items.map((row) => readString(row, "UNIT_NM") ?? readString(row, "UNIT_ENG_NM")),
    ...preview.map((row) => {
      const value = row.UNIT_NM;
      return typeof value === "string" ? value : undefined;
    }),
  ]);
}

function normalizeDimensions(meta: KosisMetaBundle, preview: DataPreviewRow[]): string[] {
  const fromMeta = meta.items.map((row) => {
    const objNm = readString(row, "OBJ_NM");
    const objId = readString(row, "OBJ_ID");
    return objNm ?? objId;
  });

  const fromPreview = preview.flatMap((row) =>
    Object.entries(row)
      .filter(([key, value]) => key.endsWith("_OBJ_NM") && typeof value === "string")
      .map(([, value]) => value as string),
  );

  return uniqueStrings([...fromMeta, ...fromPreview]);
}

function normalizePeriods(meta: KosisMetaBundle, preview: DataPreviewRow[]): string[] {
  return uniqueStrings([
    ...meta.period.map((row) => readString(row, "PRD_DE")),
    ...preview.map((row) => {
      const value = row.PRD_DE;
      return typeof value === "string" ? value : undefined;
    }),
  ]);
}

function buildTableIdentity(
  orgId: string,
  tblId: string,
  meta: KosisMetaBundle,
  explanation: JsonRecord | null,
): TableIdentity {
  const sourceRecord = meta.source[0] ?? {};
  const updatedAtRecord = meta.updatedAt[0] ?? {};
  const title = readString(meta.table[0] ?? {}, "TBL_NM") ?? tblId;
  const organization =
    readString(meta.organization[0] ?? {}, "ORG_NM") ?? readString(sourceRecord, "DEPT_NM");
  const statId = readString(sourceRecord, "STAT_ID");
  const survey =
    readString(sourceRecord, "JOSA_NM") ?? readString(explanation ?? {}, "statsNm");
  const lastPeriod = readString(updatedAtRecord, "PRD_DE") ?? readString(meta.period.at(-1) ?? {}, "PRD_DE");

  return {
    tableKey: tableKey(orgId, tblId),
    orgId,
    tblId,
    statId,
    title,
    organization,
    survey,
    period: lastPeriod,
  };
}

function estimateCellCount(
  meta: KosisMetaBundle,
  requestedPeriods: number,
  dimensionWidth = 2,
): number {
  const dimensionCount = Math.max(
    1,
    uniqueStrings(meta.items.map((row) => readString(row, "OBJ_ID"))).length,
  );
  const itemCount = Math.max(
    1,
    uniqueStrings(meta.items.map((row) => readString(row, "ITM_ID"))).length,
  );

  return requestedPeriods * itemCount * Math.max(1, dimensionCount * dimensionWidth);
}

function detectReadiness(preview: DataPreviewRow[], warnings: string[]): "high" | "medium" | "low" {
  if (preview.length > 0) {
    return "high";
  }
  if (warnings.length === 0) {
    return "medium";
  }
  return "low";
}

function summaryRow(bundle: KosisTableBundle) {
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

function intersectStrings(groups: string[][]): string[] {
  if (groups.length === 0) {
    return [];
  }

  return groups
    .reduce((accumulator, current) =>
      accumulator.filter((value) => current.includes(value)),
    )
    .filter(Boolean);
}

function chooseItemSelection(
  guide: PreviewGuide,
  keywords: string[],
  title: string,
): string | undefined {
  const loweredTitle = title.toLowerCase();
  const options = guide.itemOptions;
  if (options.length === 0) {
    return undefined;
  }

  const byName = (patterns: string[]) =>
    options.find((option) =>
      patterns.some((pattern) => option.name.includes(pattern)),
    )?.name;

  if (loweredTitle.includes("실업")) {
    return byName(["실업률", "실업자"]);
  }
  if (loweredTitle.includes("고용") || loweredTitle.includes("취업")) {
    return byName(["고용률", "취업자", "취업률"]);
  }
  if (keywords.includes("실업")) {
    return byName(["실업률", "실업자"]);
  }
  if (keywords.includes("고용") || keywords.includes("취업")) {
    return byName(["고용률", "취업자", "취업률"]);
  }

  return options[0]?.name;
}

function chooseDimensionSelections(
  guide: PreviewGuide,
  keywords: string[],
): Record<string, string> {
  const selections: Record<string, string> = {};

  for (const dimension of guide.dimensions) {
    if (
      (dimension.name.includes("연령") || dimension.objId.toLowerCase().includes("age")) &&
      keywords.includes("청년")
    ) {
      const match =
        dimension.values.find((value) => value.name.includes("15 - 29세")) ??
        dimension.values.find((value) => value.name.includes("20 - 29세")) ??
        dimension.values.find((value) => value.name.includes("청년"));
      if (match) {
        selections[dimension.name] = match.name;
        continue;
      }
    }

    if (dimension.name.includes("성별")) {
      const match =
        (keywords.includes("남성") || keywords.includes("남자"))
          ? dimension.values.find((value) => value.name.includes("남"))
          : (keywords.includes("여성") || keywords.includes("여자"))
            ? dimension.values.find((value) => value.name.includes("여"))
            : dimension.values.find(
                (value) => value.name.includes("전체") || value.name === "계",
              );
      if (match) {
        selections[dimension.name] = match.name;
        continue;
      }
    }

    if (
      (dimension.name.includes("국가") || dimension.name.includes("지역")) &&
      !Object.keys(selections).includes(dimension.name)
    ) {
      const match = dimension.values.find(
        (value) =>
          value.name.includes("전국") ||
          value.name.includes("대한민국") ||
          value.name.includes("전체") ||
          value.name === "계",
      );
      if (match) {
        selections[dimension.name] = match.name;
      }
    }
  }

  return selections;
}

function inferPreviewOptions(
  bundle: KosisTableBundle,
  keywords: string[],
): PreviewRequestOptions | undefined {
  const itemSelection = chooseItemSelection(
    bundle.previewGuide,
    keywords,
    bundle.table.title,
  );
  const dimensionSelections = chooseDimensionSelections(
    bundle.previewGuide,
    keywords,
  );

  if (!itemSelection && Object.keys(dimensionSelections).length === 0) {
    return undefined;
  }

  return {
    itemSelection,
    dimensionSelections:
      Object.keys(dimensionSelections).length > 0 ? dimensionSelections : undefined,
    newEstPrdCnt: 3,
  };
}

function computeQuestionBonus(
  bundle: KosisTableBundle,
  keywords: string[],
): number {
  let bonus = 0;
  const title = bundle.table.title;
  const optionNames = bundle.previewGuide.itemOptions.map((option) => option.name);
  const dimensionNames = bundle.previewGuide.dimensions.map((dimension) => dimension.name);

  if (keywords.includes("실업")) {
    if (title.includes("실업") || optionNames.some((name) => name.includes("실업"))) {
      bonus += 18;
    }
  }

  if (keywords.includes("고용") || keywords.includes("취업")) {
    if (
      title.includes("고용") ||
      title.includes("취업") ||
      optionNames.some(
        (name) => name.includes("고용") || name.includes("취업"),
      )
    ) {
      bonus += 18;
    }
  }

  if (keywords.includes("청년")) {
    if (
      title.includes("청년") ||
      dimensionNames.some((name) => name.includes("연령")) ||
      bundle.previewGuide.dimensions.some((dimension) =>
        dimension.values.some((value) => value.name.includes("15 - 29세")),
      )
    ) {
      bonus += 12;
    }
  }

  if (title.includes("비경제활동") && !keywords.includes("비경제활동")) {
    bonus -= 6;
  }

  return bonus;
}

function buildComparisonResult(
  bundles: KosisTableBundle[],
  options?: { focus?: string; timeRange?: string; regions?: string[] },
): ComparisonResult {
  const commonDimensions = intersectStrings(
    bundles.map((bundle) => bundle.dimensions),
  );
  const commonPeriods = intersectStrings(
    bundles.map((bundle) => bundle.coverage.periods),
  );
  const commonUnits = intersectStrings(bundles.map((bundle) => bundle.units));

  const warnings: string[] = [];
  if (commonDimensions.length === 0) {
    warnings.push("공통 분류 차원을 찾지 못했습니다.");
  }
  if (commonUnits.length === 0) {
    warnings.push("단위가 일치하지 않아 직접 비교가 제한됩니다.");
  }

  const comparisonMatrix = bundles.map((bundle) => ({
    tableKey: bundle.table.tableKey,
    title: bundle.table.title,
    organization: bundle.table.organization,
    survey: bundle.table.survey,
    lastPeriod: bundle.table.period,
    units: bundle.units,
    dimensions: bundle.dimensions,
    previewRows: bundle.dataPreview.length,
    warnings: bundle.warnings,
  }));

  const keyDifferences = uniqueStrings([
    ...bundles.flatMap((bundle) =>
      bundle.units.length > 0
        ? [`${bundle.table.title}: 단위 ${bundle.units.join(", ")}`]
        : [],
    ),
    ...bundles.flatMap((bundle) =>
      bundle.coverage.periods.length > 0
        ? [
            `${bundle.table.title}: 수록시점 ${bundle.coverage.periods
              .slice(0, 4)
              .join(", ")}`,
          ]
        : [],
    ),
  ]);

  const analysisHints = uniqueStrings([
    commonDimensions.length > 0
      ? `공통 차원 ${commonDimensions.join(", ")} 기준으로 후속 질의를 좁히세요.`
      : "행정구역, 연령, 산업 등 비교 기준 차원을 직접 지정하면 더 정확해집니다.",
    commonPeriods.length > 0
      ? `공통 수록시점 ${commonPeriods.slice(-3).join(", ")} 중심 비교가 가능합니다.`
      : "공통 시점이 없으면 동일 기간을 지정해 다시 조회하는 것이 좋습니다.",
    options?.focus ? `비교 초점 "${options.focus}" 기준으로 해석을 이어가면 됩니다.` : "",
  ]);

  return {
    tables: bundles.map(summaryRow),
    summary: {
      tableCount: bundles.length,
      comparable: commonDimensions.length > 0 && commonUnits.length > 0,
      sharedUnitCount: commonUnits.length,
      sharedDimensionCount: commonDimensions.length,
      sharedPeriodCount: commonPeriods.length,
    },
    commonDimensions,
    comparisonMatrix,
    keyDifferences,
    warnings,
    analysisHints,
    evidence: uniqueStrings([
      ...bundles.flatMap((bundle) => bundle.warnings),
      ...bundles.flatMap((bundle) =>
        bundle.dataPreview.slice(0, 3).map((row) => textFromRecord(row)),
      ),
    ]),
  };
}

export class KosisService {
  constructor(
    private readonly client: KosisClient,
    private readonly cache: FileCache,
    private readonly defaultLimit: number,
  ) {}

  async searchTopics(
    question: string,
    searchHints: string[] = [],
    limit = this.defaultLimit,
  ): Promise<SearchTopicsResult> {
    const cacheKey = JSON.stringify({ question, searchHints, limit });
    const cached = await this.cache.get<SearchTopicsResult>("search", cacheKey);
    if (cached) {
      return cached;
    }

    const { keywords, queryPlan } = buildQueryPlan(question, searchHints);
    const aggregate = new Map<string, NormalizedSearchResult>();

    for (const [queryIndex, planItem] of queryPlan.entries()) {
      let records: JsonRecord[] = [];
      try {
        records = await this.client.searchStatistics({
          searchNm: planItem.query,
          resultCount: Math.max(limit * 2, 10),
        });
      } catch (error) {
        if (error instanceof KosisApiError) {
          if (
            error.code === "30" ||
            error.message.includes("데이터가 존재하지 않습니다")
          ) {
            continue;
          }
        }
        throw error;
      }

      for (const [rankIndex, record] of records.entries()) {
        const { score, whyMatched } = scoreSearchRecord(
          keywords,
          planItem.query,
          queryIndex,
          rankIndex,
          record,
        );
        const normalized = normalizeSearchRecord(record, score, whyMatched);
        if (!normalized) {
          continue;
        }

        const current = aggregate.get(normalized.tableKey);
        if (!current || current.score < normalized.score) {
          aggregate.set(normalized.tableKey, normalized);
        } else {
          current.score += 3;
          current.whyMatched = uniqueStrings([
            ...current.whyMatched,
            ...normalized.whyMatched,
          ]);
        }
      }
    }

    const results = [...aggregate.values()]
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);

    const value = { queryPlan, results };
    await this.cache.set("search", cacheKey, value);
    return value;
  }

  async getTableBundle(
    orgId: string,
    tblId: string,
    prdSe?: string,
    previewOptions?: PreviewRequestOptions,
  ): Promise<KosisTableBundle> {
    const cacheKey = JSON.stringify({ orgId, tblId, prdSe, previewOptions });
    const cached = await this.cache.get<KosisTableBundle>("bundle", cacheKey);
    if (cached) {
      return cached;
    }

    const warnings: string[] = [];
    const getMetaSafe = async (
      params: Parameters<KosisClient["getMeta"]>[0],
      warningLabel?: string,
    ): Promise<JsonRecord[]> => {
      try {
        return await this.client.getMeta(params);
      } catch (error) {
        if (
          error instanceof KosisApiError &&
          error.message.includes("데이터가 존재하지 않습니다")
        ) {
          if (warningLabel) {
            warnings.push(`${warningLabel} 메타가 비어 있습니다.`);
          }
          return [];
        }
        throw error;
      }
    };

    const metaRequests = await Promise.all([
      getMetaSafe({ type: "TBL", orgId, tblId }),
      getMetaSafe({ type: "ORG", orgId }, "기관"),
      getMetaSafe({ type: "PRD", orgId, tblId, detail: "Y" }),
      getMetaSafe({ type: "ITM", orgId, tblId }),
      getMetaSafe({ type: "CMMT", orgId, tblId }, "주석"),
      getMetaSafe({ type: "UNIT", orgId, tblId }, "단위"),
      getMetaSafe({ type: "SOURCE", orgId, tblId }, "출처"),
      getMetaSafe({ type: "NCD", orgId, tblId, ...(prdSe ? { prdSe } : {}) }, "갱신일"),
    ]);

    const meta: KosisMetaBundle = {
      table: metaRequests[0],
      organization: metaRequests[1],
      period: metaRequests[2],
      items: metaRequests[3],
      comments: metaRequests[4],
      units: metaRequests[5],
      source: metaRequests[6],
      updatedAt: metaRequests[7],
    };

    const statId = readString(meta.source[0] ?? {}, "STAT_ID");
    let explanation: JsonRecord | null = null;

    try {
      const records = statId
        ? await this.client.getExplanation({
            statId,
            metaItm: "All",
          })
        : await this.client.getExplanation({
            orgId,
            tblId,
            metaItm: "All",
          });
      explanation = records[0] ?? null;
    } catch (error) {
      try {
        const fallback = await this.client.getExplanation({
          orgId,
          tblId,
          metaItm: "All",
        });
        explanation = fallback[0] ?? null;
      } catch {
        warnings.push("통계설명 자료를 연결하지 못했습니다.");
      }
    }

    const effectivePrdSe =
      prdSe ??
      readString(meta.updatedAt[0] ?? {}, "PRD_SE") ??
      readString(meta.period[0] ?? {}, "PRD_SE") ??
      "Y";

    let dataPreview: DataPreviewRow[] = [];
    const estimatedCells = estimateCellCount(meta, 5);

    if (estimatedCells > 40_000) {
      warnings.push("예상 조회 셀 수가 많아 preview 조회를 생략했습니다.");
    } else {
      const previewPlan = derivePreviewPlanWithSelections(
        meta,
        effectivePrdSe,
        previewOptions,
      );
      let lastPreviewError: string | undefined;

      for (const objParams of previewPlan.attempts) {
        try {
          const preview = await this.client.getStatisticsData({
            orgId,
            tblId,
            prdSe: previewPlan.prdSe,
            itmId: previewPlan.itemId,
            newEstPrdCnt: previewOptions?.newEstPrdCnt ?? 5,
            startPrdDe: previewOptions?.startPrdDe,
            endPrdDe: previewOptions?.endPrdDe,
            objParams,
          });
          dataPreview = preview.slice(0, 50).map((row) => ({
            ...row,
            tableKey: tableKey(orgId, tblId),
          }));
          break;
        } catch (error) {
          if (error instanceof KosisApiError) {
            lastPreviewError = error.message;
            continue;
          }
          lastPreviewError = "알 수 없는 preview 오류";
        }
      }

      if (dataPreview.length === 0) {
        try {
          const fallbackPreview = await fetchHtmlPreviewFallback(
            this.client.config,
            orgId,
            tblId,
            tableKey(orgId, tblId),
            previewOptions,
          );

          if (fallbackPreview && fallbackPreview.length > 0) {
            dataPreview = fallbackPreview.slice(0, 20);
            warnings.push("OpenAPI preview 대신 KOSIS HTML fallback preview를 사용했습니다.");
          } else {
            warnings.push(
              `preview 조회 실패: ${lastPreviewError ?? "미상"} (itmId=${previewPlan.itemId}, prdSe=${previewPlan.prdSe})`,
            );
          }
        } catch (fallbackError) {
          warnings.push(
            `preview 조회 실패: ${lastPreviewError ?? "미상"} (itmId=${previewPlan.itemId}, prdSe=${previewPlan.prdSe})`,
          );
        }
      }
    }

    const bundle: KosisTableBundle = {
      table: buildTableIdentity(orgId, tblId, meta, explanation),
      dataPreview,
      meta,
      explanation,
      warnings,
      units: normalizeUnits(meta, dataPreview),
      dimensions: normalizeDimensions(meta, dataPreview),
      coverage: {
        periods: normalizePeriods(meta, dataPreview),
        lastUpdated: readString(meta.updatedAt[0] ?? {}, "SEND_DE"),
      },
      previewGuide: derivePreviewPlanWithSelections(meta, effectivePrdSe, previewOptions).guide,
      previewRequest: {
        itemId: derivePreviewPlanWithSelections(meta, effectivePrdSe, previewOptions).itemId,
        prdSe: derivePreviewPlanWithSelections(meta, effectivePrdSe, previewOptions).prdSe,
        attempts: derivePreviewPlanWithSelections(meta, effectivePrdSe, previewOptions).attempts,
      },
      comparisonReadiness: detectReadiness(dataPreview, warnings),
    };

    await this.cache.set("bundle", cacheKey, bundle);
    return bundle;
  }

  async compareTables(
    tables: CompareTableInput[],
    options?: { focus?: string; timeRange?: string; regions?: string[] },
  ): Promise<ComparisonResult> {
    const bundles = await Promise.all(
      tables.map((table) => this.getTableBundle(table.orgId, table.tblId, table.prdSe)),
    );
    return buildComparisonResult(bundles, options);
  }

  async answerBundle(
    question: string,
    options?: {
      limit?: number;
      comparisonMode?: "auto" | "none" | "pairwise";
      searchHints?: string[];
    },
  ): Promise<AnswerBundle> {
    const limit = options?.limit ?? this.defaultLimit;
    const search = await this.searchTopics(question, options?.searchHints ?? [], limit);
    const keywords = tokenizeQuestion(question);
    const comparisonMode = options?.comparisonMode ?? "auto";
    const inspectedResults = search.results.slice(0, Math.min(5, search.results.length));
    const baseBundles = await Promise.all(
      inspectedResults.map((result) =>
        this.getTableBundle(result.orgId, result.tblId, undefined),
      ),
    );

    const reranked = inspectedResults
      .map((result, index) => ({
        result,
        baseBundle: baseBundles[index],
        bonus: computeQuestionBonus(baseBundles[index], keywords),
      }))
      .sort(
        (left, right) =>
          right.result.score + right.bonus - (left.result.score + left.bonus),
      );

    const pickedCount =
      comparisonMode === "pairwise" ? 2 : Math.min(3, reranked.length);
    const selected = reranked.slice(0, pickedCount);
    const bundles = await Promise.all(
      selected.map(async ({ result, baseBundle }) => {
        const autoSelections = inferPreviewOptions(baseBundle, keywords);
        if (!autoSelections) {
          return {
            result,
            bundle: baseBundle,
            autoSelections,
          };
        }

        return {
          result,
          bundle: await this.getTableBundle(
            result.orgId,
            result.tblId,
            undefined,
            autoSelections,
          ),
          autoSelections,
        };
      }),
    );

    const comparison =
      comparisonMode === "none" || bundles.length <= 1
        ? null
        : buildComparisonResult(
            bundles.map((entry) => entry.bundle),
            { focus: keywords.join(", ") },
          );

    const nextQuestions = uniqueStrings([
      search.results.length === 0
        ? "비교하려는 대상, 기간, 지역을 더 구체적으로 알려주세요."
        : "",
      bundles.some((entry) => entry.bundle.warnings.length > 0)
        ? "preview가 필요한 경우 기간이나 지역을 좁혀 다시 조회하세요."
        : "",
      comparison?.warnings.includes("단위가 일치하지 않아 직접 비교가 제한됩니다.")
        ? "단위를 맞출 수 있는 지표나 동일 계열 표만 다시 골라 비교할까요?"
        : "",
      comparison?.warnings.includes("공통 분류 차원을 찾지 못했습니다.")
        ? "지역, 성별, 연령처럼 공통 분류 기준을 지정해 다시 비교할까요?"
        : "",
    ]);

    return {
      interpretedIntent: {
        question,
        keywords,
        queryPlan: search.queryPlan,
      },
      selectedTables: bundles.map(({ result, bundle, autoSelections }) => ({
        ...bundle.table,
        whyMatched: result.whyMatched,
        score: result.score,
        warnings: bundle.warnings,
        previewRows: bundle.dataPreview.length,
        previewRequest: bundle.previewRequest,
        autoSelections,
      })),
      comparison,
      nextQuestions,
      evidence: uniqueStrings([
        ...bundles.flatMap(({ result }) => result.whyMatched),
        ...bundles.flatMap(({ bundle }) => bundle.warnings),
      ]),
    };
  }
}
