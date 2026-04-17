import test from "node:test";
import assert from "node:assert/strict";
import { FileCache } from "../src/kosis/cache.js";
import { KosisApiError } from "../src/kosis/errors.js";
import { filterRowsToSelectedClasses } from "../src/kosis/html-fallback.js";
import { resolveDefaultPeriodCode, resolvePeriodList } from "../src/kosis/html-fallback-core.js";
import { inferQuestionIntent } from "../src/kosis/intent.js";
import { buildQueryPlan, scoreSearchRecord } from "../src/kosis/relevance.js";
import { KosisService } from "../src/kosis/service.js";
import type { JsonRecord } from "../src/kosis/types.js";
import { guessDefaultDimensionValue } from "../src/kosis/utils.js";

class FakeClient {
  async searchStatistics(params: { searchNm: string }): Promise<JsonRecord[]> {
    if (params.searchNm.includes("없는") || params.searchNm.includes("보건")) {
      return [];
    }

    return [
      {
        ORG_ID: "101",
        ORG_NM: "통계청",
        TBL_ID: "DT_TEST_A",
        TBL_NM: "고용률",
        STAT_ID: "STAT_A",
        STAT_NM: "경제활동인구조사",
        MT_ATITLE: "고용 > 고용률",
        STRT_PRD_DE: "2020",
        END_PRD_DE: "2024",
        REC_TBL_SE: "Y",
      },
      {
        ORG_ID: "101",
        ORG_NM: "통계청",
        TBL_ID: "DT_TEST_B",
        TBL_NM: "실업률",
        STAT_ID: "STAT_B",
        STAT_NM: "경제활동인구조사",
        MT_ATITLE: "고용 > 실업률",
        STRT_PRD_DE: "2020",
        END_PRD_DE: "2024",
      },
    ];
  }

  async getMeta(params: { type: string; tblId?: string }): Promise<JsonRecord[]> {
    switch (params.type) {
      case "TBL":
        return [
          {
            TBL_NM:
              params.tblId === "DT_TEST_A"
                ? "고용률"
                : params.tblId === "DT_HEALTH_A"
                  ? "의료인력 현황"
                  : "실업률",
          },
        ];
      case "ORG":
        return [{ ORG_NM: "통계청" }];
      case "PRD":
        return [
          { PRD_SE: "Y", PRD_DE: "2023" },
          { PRD_SE: "Y", PRD_DE: "2024" },
        ];
      case "ITM":
        return [
          {
            OBJ_ID: "ITEM",
            OBJ_NM: "항목",
            ITM_ID:
              params.tblId === "DT_TEST_A"
                ? "EMP"
                : params.tblId === "DT_HEALTH_A"
                  ? "MED"
                  : "UNE",
            ITM_NM:
              params.tblId === "DT_TEST_A"
                ? "고용률"
                : params.tblId === "DT_HEALTH_A"
                  ? "의료인력수"
                  : "실업률",
            UNIT_NM: "%",
          },
          {
            OBJ_ID: "REGION",
            OBJ_NM: "지역",
            OBJ_ID_SN: "1",
            ITM_ID: "ALL",
            ITM_NM: "전국",
            UNIT_NM: "%",
          },
          {
            OBJ_ID: "REGION",
            OBJ_NM: "지역",
            OBJ_ID_SN: "1",
            ITM_ID: "SEOUL",
            ITM_NM: "서울",
            UNIT_NM: "%",
          },
          {
            OBJ_ID: "SEX",
            OBJ_NM: "성별",
            OBJ_ID_SN: "2",
            ITM_ID: "TOT",
            ITM_NM: "계",
            UNIT_NM: "%",
          },
          {
            OBJ_ID: "SEX",
            OBJ_NM: "성별",
            OBJ_ID_SN: "2",
            ITM_ID: "M",
            ITM_NM: "남자",
            UNIT_NM: "%",
          },
        ];
      case "CMMT":
        return [{ CMMT_NM: "주석", CMMT_DC: "테스트" }];
      case "UNIT":
        return [{ UNIT_NM: "%" }];
      case "SOURCE":
        return [
          {
            JOSA_NM: params.tblId === "DT_HEALTH_A" ? "보건통계" : "경제활동인구조사",
            STAT_ID:
              params.tblId === "DT_TEST_A"
                ? "STAT_A"
                : params.tblId === "DT_HEALTH_A"
                  ? "STAT_H"
                  : "STAT_B",
          },
        ];
      case "NCD":
        return [{ PRD_SE: "Y", PRD_DE: "2024", SEND_DE: "20250101" }];
      case "WGT":
        return [
          {
            C1: "ALL",
            C1_NM: "전국",
            ITM_ID: params.tblId === "DT_TEST_A" ? "EMP" : "UNE",
            ITM_NM: params.tblId === "DT_TEST_A" ? "고용률" : "실업률",
            WGT_CO: "1.0000000000",
          },
        ];
      default:
        return [];
    }
  }

  async getExplanation(params: { statId?: string }): Promise<JsonRecord[]> {
    return [
      {
        statsNm:
          params.statId === "STAT_A"
            ? "경제활동인구조사 A"
            : params.statId === "STAT_H"
              ? "보건통계 H"
              : "경제활동인구조사 B",
      },
    ];
  }

  async getStatisticsData(params: {
    tblId: string;
    itmId?: string;
    objParams?: Record<string, string>;
  }): Promise<JsonRecord[]> {
    if (params.itmId === "EMP" && params.objParams?.objL1 === "SEOUL") {
      return [
        {
          TBL_NM: "고용률",
          C1_OBJ_NM: "지역",
          C1_NM: "서울",
          C2_OBJ_NM: "성별",
          C2_NM: "계",
          ITM_NM: "고용률",
          UNIT_NM: "%",
          PRD_DE: "2024",
          DT: "63.1",
        },
      ];
    }

    return [
      {
        TBL_NM:
          params.tblId === "DT_TEST_A"
            ? "고용률"
            : params.tblId === "DT_HEALTH_A"
              ? "의료인력 현황"
              : "실업률",
        C1_OBJ_NM: "지역",
        C1_NM: "전국",
        ITM_NM:
          params.tblId === "DT_TEST_A"
            ? "고용률"
            : params.tblId === "DT_HEALTH_A"
              ? "의료인력수"
              : "실업률",
        UNIT_NM: "%",
        PRD_DE: "2024",
        DT:
          params.tblId === "DT_TEST_A"
            ? "62.7"
            : params.tblId === "DT_HEALTH_A"
              ? "123.4"
              : "2.9",
      },
    ];
  }

  async getIndicatorExplanationById(params: {
    indicatorId: string;
  }): Promise<JsonRecord[]> {
    return [
      {
        statJipyoId: params.indicatorId,
        statJipyoNm: params.indicatorId === "1001" ? "고용률" : "실업률",
        jipyoExplan: params.indicatorId === "1001" ? "고용률 설명" : "실업률 설명",
        jipyoExplan1:
          params.indicatorId === "1001"
            ? "취업자 비율에 대한 지표다."
            : "경제활동인구 대비 실업자 비율이다.",
      },
    ];
  }

  async getIndicatorExplanationByName(params: {
    indicatorName: string;
  }): Promise<JsonRecord[]> {
    if (params.indicatorName.includes("고용")) {
      return this.getIndicatorExplanationById({ indicatorId: "1001" });
    }
    if (params.indicatorName.includes("실업")) {
      return this.getIndicatorExplanationById({ indicatorId: "1002" });
    }
    return [];
  }

  async searchIndicatorLists(params: {
    indicatorId?: string;
    indicatorName?: string;
  }): Promise<JsonRecord[]> {
    if (params.indicatorId === "1001" || params.indicatorName?.includes("고용")) {
      return [
        {
          statJipyoId: "1001",
          statJipyoNm: "고용률",
          unit: "%",
          areaTypeName: "전국",
          prdSeName: "연간",
          strtPrdDe: "2020",
          endPrdDe: "2024",
          prdDe: "2024 연간",
        },
      ];
    }
    if (params.indicatorId === "1002" || params.indicatorName?.includes("실업")) {
      return [
        {
          statJipyoId: "1002",
          statJipyoNm: "실업률",
          unit: "%",
          areaTypeName: "전국",
          prdSeName: "연간",
          strtPrdDe: "2020",
          endPrdDe: "2024",
          prdDe: "2024 연간",
        },
      ];
    }
    return [];
  }

  async getIndicatorDetailById(params: {
    indicatorId: string;
  }): Promise<JsonRecord[]> {
    return [
      {
        statJipyoId: params.indicatorId,
        statJipyoNm: params.indicatorId === "1001" ? "고용률" : "실업률",
        prdSe: "Y",
        prdDe: "2023",
        itmNm: params.indicatorId === "1001" ? "고용률" : "실업률",
        val: params.indicatorId === "1001" ? "62.1" : "3.1",
        unit: "%",
      },
      {
        statJipyoId: params.indicatorId,
        statJipyoNm: params.indicatorId === "1001" ? "고용률" : "실업률",
        prdSe: "Y",
        prdDe: "2024",
        itmNm: params.indicatorId === "1001" ? "고용률" : "실업률",
        val: params.indicatorId === "1001" ? "62.7" : "2.9",
        unit: "%",
      },
    ];
  }

  async getIndicatorDetailByName(params: {
    indicatorName: string;
  }): Promise<JsonRecord[]> {
    if (params.indicatorName.includes("고용")) {
      return this.getIndicatorDetailById({ indicatorId: "1001" });
    }
    if (params.indicatorName.includes("실업")) {
      return this.getIndicatorDetailById({ indicatorId: "1002" });
    }
    return [];
  }

  async getStatisticsList(params: {
    vwCd: string;
    parentListId: string;
  }): Promise<JsonRecord[]> {
    if (params.parentListId === "A") {
      return [
        {
          VW_CD: params.vwCd,
          LIST_ID: "L_EMP",
          LIST_NM: "고용",
        },
        {
          VW_CD: params.vwCd,
          LIST_ID: "L_HEALTH",
          LIST_NM: "보건",
        },
      ];
    }

    if (params.parentListId === "L_EMP") {
      return [
        {
          VW_CD: params.vwCd,
          LIST_ID: "L_EMP_SUB",
          LIST_NM: "고용률",
          ORG_ID: "101",
          TBL_ID: "DT_TEST_A",
          TBL_NM: "고용률",
          STAT_ID: "STAT_A",
        },
        {
          VW_CD: params.vwCd,
          LIST_ID: "L_EMP_SUB2",
          LIST_NM: "실업률",
          ORG_ID: "101",
          TBL_ID: "DT_TEST_B",
          TBL_NM: "실업률",
          STAT_ID: "STAT_B",
        },
      ];
    }

    if (params.parentListId === "L_HEALTH") {
      return [
        {
          VW_CD: params.vwCd,
          LIST_ID: "L_HEALTH_WORKFORCE",
          LIST_NM: "의료인력",
        },
      ];
    }

    if (params.parentListId === "L_HEALTH_WORKFORCE") {
      return [
        {
          VW_CD: params.vwCd,
          LIST_ID: "L_HEALTH_WORKFORCE_TABLE",
          LIST_NM: "의료인력 현황",
          ORG_ID: "101",
          TBL_ID: "DT_HEALTH_A",
          TBL_NM: "의료인력 현황",
          STAT_ID: "STAT_H",
        },
      ];
    }

    return [];
  }
}

async function createService(
  cacheDir: string,
  client: FakeClient = new FakeClient(),
  options?: {
    clearCache?: boolean;
    ttlMs?: number;
  },
): Promise<KosisService> {
  const cache = new FileCache(cacheDir, options?.ttlMs ?? 10_000);
  if (options?.clearCache !== false) {
    await cache.clearAll();
  }
  return new KosisService(client as never, cache, 5);
}

test("searchTopics returns ranked results and query plan", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-search");

  const result = await service.searchTopics("고용 상황이 궁금해", [], 5);

  assert.equal(result.cacheStatus, "miss");
  assert.ok(result.queryPlan.length >= 1);
  assert.ok(result.attempts.length >= 1);
  assert.equal(result.attempts[0]?.provider, "statisticsSearch");
  assert.equal(result.results[0]?.tblId, "DT_TEST_A");
  assert.ok(result.results[0]?.whyMatched.length);
});

test("searchIndicators returns ranked indicator results", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-indicator-search");

  const result = await service.searchIndicators("대한민국 실업률 설명을 찾아줘", [], 5);

  assert.ok(result.attempts.length >= 1);
  assert.ok(result.queryPlan.length >= 1);
  assert.equal(result.results[0]?.indicatorId, "1002");
  assert.equal(result.results[0]?.indicatorName, "실업률");
  assert.ok(result.results[0]?.matchedStrategies.length >= 1);
});

class Indicator404FallbackClient extends FakeClient {
  override async searchIndicatorLists(params: {
    indicatorId?: string;
    indicatorName?: string;
  }): Promise<JsonRecord[]> {
    if (
      params.indicatorName?.includes("대한민국") ||
      params.indicatorName?.includes("설명자료") ||
      params.indicatorName?.includes("경제활동인구조사")
    ) {
      throw new KosisApiError("KOSIS request failed with status 404: site moved");
    }
    return super.searchIndicatorLists(params);
  }

  override async getIndicatorExplanationByName(params: {
    indicatorName: string;
  }): Promise<JsonRecord[]> {
    if (
      params.indicatorName.includes("대한민국") ||
      params.indicatorName.includes("설명자료")
    ) {
      return [];
    }
    return super.getIndicatorExplanationByName(params);
  }
}

test("searchIndicators survives 404s and falls back to simpler indicator queries", async () => {
  const service = await createService(
    "/tmp/kosis-question-mcp-test-indicator-404-fallback",
    new Indicator404FallbackClient(),
  );

  const result = await service.searchIndicators("대한민국 실업률 최근 추이를 보여줘", [], 5);

  assert.ok(result.results.length >= 1);
  assert.equal(result.results[0]?.indicatorId, "1002");
  assert.ok(result.queryPlan.some((item) => item.query === "실업률 설명자료"));
  assert.ok(result.attempts.some((attempt) => attempt.outcome === "error" && attempt.errorType === "404"));
  assert.ok(result.results[0]?.matchedStrategies.some((strategy) => strategy.includes("sanitized")));
});

test("browseCatalog returns ranked catalog and table candidates", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-catalog");

  const result = await service.browseCatalog("고용 분야에서 볼 자료를 찾아줘", [], 5);

  assert.ok(result.exploredViews.length >= 1);
  assert.ok(result.results.some((entry) => entry.tblId === "DT_TEST_A"));
  assert.ok(result.results.some((entry) => entry.listId === "L_EMP"));
});

test("browseCatalog explores deeper list levels for browse intent", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-catalog-deep");

  const result = await service.browseCatalog("보건 분야에서 어떤 자료가 있는지 찾아줘", [], 5);

  assert.ok(result.results.some((entry) => entry.depth === 2));
  assert.ok(result.results.some((entry) => entry.tblId === "DT_HEALTH_A"));
});

test("getTableBundle combines preview, meta and explanation", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-bundle");

  const bundle = await service.getTableBundle("101", "DT_TEST_A", "Y");

  assert.equal(bundle.table.title, "고용률");
  assert.equal(bundle.meta.source[0]?.STAT_ID, "STAT_A");
  assert.equal(bundle.dataPreview.length, 1);
  assert.equal(bundle.explanation?.statsNm, "경제활동인구조사 A");
  assert.equal(bundle.previewGuide.dimensions.length, 2);
  assert.equal(bundle.meta.weights.length, 1);
  assert.equal(bundle.provenance.previewSource, "openapi");
  assert.equal(bundle.provenance.explanationSource, "statId");
  assert.equal(bundle.provenance.cacheStatus, "miss");
  assert.ok(bundle.provenance.previewAttempts.length >= 1);
  assert.equal(bundle.provenance.previewAttempts[0]?.provider, "statisticsData");
  assert.ok(bundle.provenance.metaSources.some((entry) => entry.type === "WGT"));
});

class FailingSearchClient extends FakeClient {
  override async searchStatistics(): Promise<JsonRecord[]> {
    throw new KosisApiError("서버 오류", "50");
  }
}

test("searchTopics falls back to stale cache when revalidation fails", async () => {
  const cacheDir = "/tmp/kosis-question-mcp-test-search-stale";
  const warmService = await createService(cacheDir, new FakeClient(), {
    ttlMs: -1,
  });
  await warmService.searchTopics("고용 상황이 궁금해", [], 5);

  const staleService = await createService(cacheDir, new FailingSearchClient(), {
    clearCache: false,
    ttlMs: -1,
  });
  const result = await staleService.searchTopics("고용 상황이 궁금해", [], 5);

  assert.equal(result.cacheStatus, "expired-revalidate-failed-stale-used");
  assert.ok(result.results.length >= 1);
  assert.equal(result.attempts.at(-1)?.provider, "cache");
  assert.equal(result.attempts.at(-1)?.outcome, "stale-ok");
});

class IndicatorIdListFallbackClient extends FakeClient {
  override async searchIndicatorLists(params: {
    indicatorId?: string;
    indicatorName?: string;
  }): Promise<JsonRecord[]> {
    if (params.indicatorId) {
      throw new KosisApiError("필수요청변수값이 누락되었습니다.", "20");
    }
    return [
      {
        statJipyoId: "1152",
        statJipyoNm: "실업률",
        unit: "%",
        areaTypeName: "국가",
        prdSeName: "년",
        strtPrdDe: "1990",
        endPrdDe: "2024",
        prdDe: "2024년",
      },
    ];
  }

  override async getIndicatorExplanationById(): Promise<JsonRecord[]> {
    throw new KosisApiError("데이터가 존재하지 않습니다.", "30");
  }

  override async getIndicatorExplanationByName(): Promise<JsonRecord[]> {
    return [
      {
        statJipyoId: "1152",
        statJipyoNm: "실업률",
        jipyoExplan: "실업률 설명",
        jipyoExplan1: "경제활동인구 대비 실업자 비율이다.",
      },
    ];
  }

  override async getIndicatorDetailById(): Promise<JsonRecord[]> {
    return [
      {
        statJipyoId: "1152",
        statJipyoNm: "실업률",
        prdSe: "Y",
        prdDe: "2015",
        itmNm: "한국",
        val: "3.6",
      },
      {
        statJipyoId: "1152",
        statJipyoNm: "실업률",
        prdSe: "Y",
        prdDe: "2024",
        itmNm: "한국",
        val: "2.8",
      },
    ];
  }
}

test("getIndicatorBundle falls back from id list lookup to name lookup", async () => {
  const service = await createService(
    "/tmp/kosis-question-mcp-test-indicator-id-list-fallback",
    new IndicatorIdListFallbackClient(),
  );

  const bundle = await service.getIndicatorBundle({
    indicatorId: "1152",
    indicatorName: "실업률",
    startPrdDe: "2015",
    endPrdDe: "2024",
    srvRn: 10,
  });

  assert.equal(bundle.indicator.indicatorId, "1152");
  assert.equal(bundle.provenance.listSource, "indicatorName");
  assert.equal(bundle.provenance.explanationSource, "indicatorName");
  assert.equal(bundle.provenance.detailSource, "indicatorId");
  assert.ok(
    bundle.provenance.lookupAttempts.some(
      (attempt) =>
        attempt.provider === "indicatorListById" &&
        attempt.outcome === "error" &&
        attempt.errorClass === "fatal-request",
    ),
  );
});

test("getIndicatorBundle combines explanation, list context and detail rows", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-indicator-bundle");

  const bundle = await service.getIndicatorBundle({
    indicatorName: "실업률",
    srvRn: 2,
  });

  assert.equal(bundle.indicator.indicatorId, "1002");
  assert.equal(bundle.explanation?.jipyoExplan, "실업률 설명");
  assert.equal(bundle.listMatches.length, 1);
  assert.equal(bundle.detailRows.length, 2);
  assert.equal(bundle.coverage.latest, "2024 연간");
  assert.equal(bundle.provenance.explanationSource, "indicatorId");
  assert.equal(bundle.provenance.detailSource, "indicatorId");
});

class AnnualIndicatorPreferenceClient extends FakeClient {
  override async searchIndicatorLists(params: {
    indicatorId?: string;
    indicatorName?: string;
  }): Promise<JsonRecord[]> {
    if (params.indicatorId) {
      const map: Record<string, JsonRecord> = {
        "274": {
          statJipyoId: "274",
          statJipyoNm: "실업률(월, 여자, 시계열보정)",
          unit: "%",
          areaTypeName: "전국",
          prdSeName: "월",
          strtPrdDe: "199906",
          endPrdDe: "202603",
          prdDe: "2026년3월",
        },
        "275": {
          statJipyoId: "275",
          statJipyoNm: "실업률(월, 남자, 시계열보정)",
          unit: "%",
          areaTypeName: "전국",
          prdSeName: "월",
          strtPrdDe: "199906",
          endPrdDe: "202603",
          prdDe: "2026년3월",
        },
        "276": {
          statJipyoId: "276",
          statJipyoNm: "실업률(월, 계, 시계열보정)",
          unit: "%",
          areaTypeName: "전국",
          prdSeName: "월",
          strtPrdDe: "199906",
          endPrdDe: "202603",
          prdDe: "2026년3월",
        },
        "1152": {
          statJipyoId: "1152",
          statJipyoNm: "실업률",
          unit: "%",
          areaTypeName: "국가",
          prdSeName: "년",
          strtPrdDe: "1990",
          endPrdDe: "2024",
          prdDe: "2024년",
        },
      };
      return map[params.indicatorId] ? [map[params.indicatorId]] : [];
    }

    if (params.indicatorName?.includes("실업률")) {
      return [
        {
          statJipyoId: "274",
          statJipyoNm: "실업률(월, 여자, 시계열보정)",
          unit: "%",
          areaTypeName: "전국",
          prdSeName: "월",
          strtPrdDe: "199906",
          endPrdDe: "202603",
          prdDe: "2026년3월",
        },
        {
          statJipyoId: "275",
          statJipyoNm: "실업률(월, 남자, 시계열보정)",
          unit: "%",
          areaTypeName: "전국",
          prdSeName: "월",
          strtPrdDe: "199906",
          endPrdDe: "202603",
          prdDe: "2026년3월",
        },
        {
          statJipyoId: "276",
          statJipyoNm: "실업률(월, 계, 시계열보정)",
          unit: "%",
          areaTypeName: "전국",
          prdSeName: "월",
          strtPrdDe: "199906",
          endPrdDe: "202603",
          prdDe: "2026년3월",
        },
        {
          statJipyoId: "1152",
          statJipyoNm: "실업률",
          unit: "%",
          areaTypeName: "국가",
          prdSeName: "년",
          strtPrdDe: "1990",
          endPrdDe: "2024",
          prdDe: "2024년",
        },
      ];
    }
    return [];
  }

  override async getIndicatorExplanationById(params: {
    indicatorId: string;
  }): Promise<JsonRecord[]> {
    return [
      {
        statJipyoId: params.indicatorId,
        statJipyoNm: params.indicatorId === "1152" ? "실업률" : "실업률(월, 계, 시계열보정)",
        jipyoExplan: "실업률 설명",
        jipyoExplan1: "경제활동인구 대비 실업자 비율이다.",
      },
    ];
  }

  override async getIndicatorExplanationByName(): Promise<JsonRecord[]> {
    return [];
  }

  override async getIndicatorDetailById(params: {
    indicatorId: string;
  }): Promise<JsonRecord[]> {
    if (params.indicatorId === "1152") {
      return [
        {
          statJipyoId: "1152",
          statJipyoNm: "실업률",
          prdSe: "Y",
          prdDe: "2015",
          itmNm: "한국",
          val: "3.6",
        },
        {
          statJipyoId: "1152",
          statJipyoNm: "실업률",
          prdSe: "Y",
          prdDe: "2024",
          itmNm: "한국",
          val: "2.8",
        },
      ];
    }
    return [
      {
        statJipyoId: params.indicatorId,
        statJipyoNm: "실업률(월, 계, 시계열보정)",
        prdSe: "M",
        prdDe: "202603",
        itmNm: "계",
        val: "2.9",
      },
    ];
  }

  override async getIndicatorDetailByName(): Promise<JsonRecord[]> {
    return [];
  }
}

test("answerBundle prefers annual unemployment indicator for long-horizon change questions", async () => {
  const service = await createService(
    "/tmp/kosis-question-mcp-test-annual-indicator-preference",
    new AnnualIndicatorPreferenceClient(),
  );

  const answer = await service.answerBundle(
    "지난 10년간 대한민국 실업률 증감비율을 구해줘",
    { comparisonMode: "none" },
  );

  assert.equal(answer.selectedIndicators[0]?.indicatorId, "1152");
  assert.equal(answer.selectedIndicators[0]?.indicatorName, "실업률");
});

class MarriageDivorceCompareClient extends FakeClient {
  override async searchStatistics(): Promise<JsonRecord[]> {
    return [
      {
        ORG_ID: "101",
        ORG_NM: "통계청",
        TBL_ID: "DT_BROAD",
        TBL_NM: "시군구/인구동태건수 및 동태율(출생,사망,혼인,이혼)",
        STAT_ID: "STAT_MD",
        STAT_NM: "인구동향조사",
        MT_ATITLE: "인구 > 인구동향조사 > 인구동태건수 및 동태율",
        STRT_PRD_DE: "2000",
        END_PRD_DE: "2024",
        REC_TBL_SE: "Y",
      },
      {
        ORG_ID: "101",
        ORG_NM: "통계청",
        TBL_ID: "DT_MARRIAGE",
        TBL_NM: "혼인건수, 조혼인율",
        STAT_ID: "STAT_MD",
        STAT_NM: "인구동향조사",
        MT_ATITLE: "인구 > 인구동향조사 > 혼인",
        STRT_PRD_DE: "1970",
        END_PRD_DE: "2024",
      },
      {
        ORG_ID: "101",
        ORG_NM: "통계청",
        TBL_ID: "DT_DIVORCE",
        TBL_NM: "이혼건수, 조이혼율",
        STAT_ID: "STAT_MD",
        STAT_NM: "인구동향조사",
        MT_ATITLE: "인구 > 인구동향조사 > 이혼",
        STRT_PRD_DE: "1970",
        END_PRD_DE: "2024",
      },
    ];
  }

  override async getMeta(params: { type: string; tblId?: string }): Promise<JsonRecord[]> {
    if (params.type === "TBL") {
      return [
        {
          TBL_NM:
            params.tblId === "DT_MARRIAGE"
              ? "혼인건수, 조혼인율"
              : params.tblId === "DT_DIVORCE"
                ? "이혼건수, 조이혼율"
                : "시군구/인구동태건수 및 동태율(출생,사망,혼인,이혼)",
        },
      ];
    }
    if (params.type === "ITM") {
      if (params.tblId === "DT_MARRIAGE") {
        return [
          { OBJ_ID: "ITEM", OBJ_NM: "항목", ITM_ID: "T1", ITM_NM: "인구동태건수 및 동태율 추이" },
          { OBJ_ID: "A", OBJ_NM: "기본항목별", OBJ_ID_SN: "1", ITM_ID: "41", ITM_NM: "혼인건수(건)" },
        ];
      }
      if (params.tblId === "DT_DIVORCE") {
        return [
          { OBJ_ID: "ITEM", OBJ_NM: "항목", ITM_ID: "T1", ITM_NM: "인구동태건수 및 동태율 추이" },
          { OBJ_ID: "A", OBJ_NM: "기본항목별", OBJ_ID_SN: "1", ITM_ID: "51", ITM_NM: "이혼건수(건)" },
        ];
      }
      return [
        { OBJ_ID: "ITEM", OBJ_NM: "항목", ITM_ID: "T1", ITM_NM: "인구동태건수 및 동태율 추이" },
        { OBJ_ID: "A", OBJ_NM: "기본항목별", OBJ_ID_SN: "1", ITM_ID: "41", ITM_NM: "혼인건수(건)" },
        { OBJ_ID: "A", OBJ_NM: "기본항목별", OBJ_ID_SN: "1", ITM_ID: "51", ITM_NM: "이혼건수(건)" },
      ];
    }
    if (params.type === "PRD") {
      return [
        { PRD_SE: "Y", PRD_DE: "2015" },
        { PRD_SE: "Y", PRD_DE: "2024" },
      ];
    }
    if (params.type === "SOURCE") {
      return [{ JOSA_NM: "인구동향조사", STAT_ID: "STAT_MD" }];
    }
    if (params.type === "NCD") {
      return [{ PRD_SE: "Y", PRD_DE: "2024", SEND_DE: "20250101" }];
    }
    return super.getMeta(params);
  }

  override async getStatisticsData(params: { tblId: string }): Promise<JsonRecord[]> {
    if (params.tblId === "DT_MARRIAGE") {
      return [{ TBL_NM: "혼인건수, 조혼인율", ITM_NM: "혼인건수(건)", PRD_DE: "2024", DT: "222412" }];
    }
    if (params.tblId === "DT_DIVORCE") {
      return [{ TBL_NM: "이혼건수, 조이혼율", ITM_NM: "이혼건수(건)", PRD_DE: "2024", DT: "91151" }];
    }
    return [{ TBL_NM: "시군구/인구동태건수 및 동태율(출생,사망,혼인,이혼)", ITM_NM: "혼인건수(건)", PRD_DE: "2024", DT: "1" }];
  }
}

test("answerBundle prefers marriage and divorce pair for compare questions", async () => {
  const service = await createService(
    "/tmp/kosis-question-mcp-test-marriage-divorce-compare",
    new MarriageDivorceCompareClient(),
  );

  const answer = await service.answerBundle(
    "지난 10년간 이혼과 혼인 건수 비교표를 보여줘",
    { comparisonMode: "auto" },
  );

  assert.ok(answer.comparison);
  assert.ok(answer.selectedTables.some((table) => table.tblId === "DT_MARRIAGE"));
  assert.ok(answer.selectedTables.some((table) => table.tblId === "DT_DIVORCE"));
  assert.ok(!answer.selectedTables.every((table) => table.tblId === "DT_BROAD"));
});

class BirthDeathCompareClient extends FakeClient {
  override async searchStatistics(): Promise<JsonRecord[]> {
    return [
      {
        ORG_ID: "101",
        ORG_NM: "통계청",
        TBL_ID: "DT_VITAL",
        TBL_NM: "인구동태건수 및 동태율 추이(출생,사망,혼인,이혼)",
        STAT_ID: "STAT_VITAL",
        STAT_NM: "인구동향조사",
        MT_ATITLE: "인구 > 인구동향조사 > 인구동태건수 및 동태율",
        STRT_PRD_DE: "1970",
        END_PRD_DE: "2024",
        REC_TBL_SE: "Y",
      },
      {
        ORG_ID: "101",
        ORG_NM: "통계청",
        TBL_ID: "DT_BIRTH",
        TBL_NM: "출생아수, 조출생률",
        STAT_ID: "STAT_VITAL",
        STAT_NM: "인구동향조사",
        MT_ATITLE: "인구 > 인구동향조사 > 출생",
        STRT_PRD_DE: "1970",
        END_PRD_DE: "2024",
      },
      {
        ORG_ID: "101",
        ORG_NM: "통계청",
        TBL_ID: "DT_DEATH",
        TBL_NM: "사망자수, 조사망률",
        STAT_ID: "STAT_VITAL",
        STAT_NM: "인구동향조사",
        MT_ATITLE: "인구 > 인구동향조사 > 사망",
        STRT_PRD_DE: "1970",
        END_PRD_DE: "2024",
      },
    ];
  }

  override async getMeta(params: { type: string; tblId?: string }): Promise<JsonRecord[]> {
    if (params.type === "TBL") {
      return [
        {
          TBL_NM:
            params.tblId === "DT_BIRTH"
              ? "출생아수, 조출생률"
              : params.tblId === "DT_DEATH"
                ? "사망자수, 조사망률"
                : "인구동태건수 및 동태율 추이(출생,사망,혼인,이혼)",
        },
      ];
    }
    if (params.type === "ITM") {
      if (params.tblId === "DT_BIRTH") {
        return [
          { OBJ_ID: "ITEM", OBJ_NM: "항목", ITM_ID: "T1", ITM_NM: "인구동태건수 및 동태율 추이" },
          { OBJ_ID: "A", OBJ_NM: "기본항목별", OBJ_ID_SN: "1", ITM_ID: "11", ITM_NM: "출생아수(명)" },
        ];
      }
      if (params.tblId === "DT_DEATH") {
        return [
          { OBJ_ID: "ITEM", OBJ_NM: "항목", ITM_ID: "T1", ITM_NM: "인구동태건수 및 동태율 추이" },
          { OBJ_ID: "A", OBJ_NM: "기본항목별", OBJ_ID_SN: "1", ITM_ID: "21", ITM_NM: "사망자수(명)" },
        ];
      }
      return [
        { OBJ_ID: "ITEM", OBJ_NM: "항목", ITM_ID: "T1", ITM_NM: "인구동태건수 및 동태율 추이" },
        { OBJ_ID: "A", OBJ_NM: "기본항목별", OBJ_ID_SN: "1", ITM_ID: "11", ITM_NM: "출생아수(명)" },
        { OBJ_ID: "A", OBJ_NM: "기본항목별", OBJ_ID_SN: "1", ITM_ID: "21", ITM_NM: "사망자수(명)" },
      ];
    }
    if (params.type === "PRD") {
      return [
        { PRD_SE: "Y", PRD_DE: "2015" },
        { PRD_SE: "Y", PRD_DE: "2024" },
      ];
    }
    if (params.type === "SOURCE") {
      return [{ JOSA_NM: "인구동향조사", STAT_ID: "STAT_VITAL" }];
    }
    if (params.type === "NCD") {
      return [{ PRD_SE: "Y", PRD_DE: "2024", SEND_DE: "20250101" }];
    }
    return super.getMeta(params);
  }

  override async getStatisticsData(params: { tblId: string }): Promise<JsonRecord[]> {
    if (params.tblId === "DT_BIRTH") {
      return [{ TBL_NM: "출생아수, 조출생률", ITM_NM: "출생아수(명)", PRD_DE: "2024", DT: "238300" }];
    }
    if (params.tblId === "DT_DEATH") {
      return [{ TBL_NM: "사망자수, 조사망률", ITM_NM: "사망자수(명)", PRD_DE: "2024", DT: "358000" }];
    }
    return [{ TBL_NM: "인구동태건수 및 동태율 추이(출생,사망,혼인,이혼)", ITM_NM: "출생아수(명)", PRD_DE: "2024", DT: "1" }];
  }
}

test("answerBundle generalizes compare pair selection beyond marriage and divorce", async () => {
  const service = await createService(
    "/tmp/kosis-question-mcp-test-birth-death-compare",
    new BirthDeathCompareClient(),
  );

  const answer = await service.answerBundle(
    "지난 10년간 출생과 사망 건수 비교표를 보여줘",
    { comparisonMode: "auto" },
  );

  assert.ok(answer.selectedTables.some((table) => table.tblId === "DT_BIRTH"));
  assert.ok(answer.selectedTables.some((table) => table.tblId === "DT_DEATH"));
});

test("answerBundle handles compare phrasing with 대비", async () => {
  const service = await createService(
    "/tmp/kosis-question-mcp-test-birth-death-compare-versus",
    new BirthDeathCompareClient(),
  );

  const answer = await service.answerBundle(
    "지난 10년간 출생아 수 대비 사망자 수 비교표를 보여줘",
    { comparisonMode: "auto" },
  );

  assert.ok(answer.selectedTables.some((table) => table.tblId === "DT_BIRTH"));
  assert.ok(answer.selectedTables.some((table) => table.tblId === "DT_DEATH"));
});

test("compareTables exposes shared dimensions and units", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-compare");

  const comparison = await service.compareTables([
    { orgId: "101", tblId: "DT_TEST_A" },
    { orgId: "101", tblId: "DT_TEST_B" },
  ]);

  assert.ok(comparison.commonDimensions.includes("지역"));
  assert.ok(comparison.summary.comparable);
  assert.equal(comparison.tables.length, 2);
  assert.ok(comparison.comparisonMatrix.length >= 1);
  assert.ok(
    Object.keys(comparison.comparisonMatrix[0] ?? {}).some((key) =>
      key.includes("고용률"),
    ),
  );
});

test("getTableBundle supports explicit dimension selections for preview retries", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-selection");

  const bundle = await service.getTableBundle("101", "DT_TEST_A", "Y", {
    dimensionSelections: {
      지역: "서울",
      SEX: "TOT",
    },
    itemSelection: "고용률",
  });

  assert.equal(bundle.dataPreview[0]?.C1_NM, "서울");
  assert.equal(bundle.previewRequest.itemId, "EMP");
  assert.equal(bundle.previewRequest.attempts[0]?.objL1, "SEOUL");
});

test("getTableBundle exposes actual fallback period code in previewRequest", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-fallback-prdse");

  const bundle = await service.getTableBundle("101", "DT_TEST_A", "Y");

  assert.equal(bundle.previewRequest.prdSe, "Y");
  assert.equal(bundle.provenance.previewParameters.prdSe, "Y");
});

test("searchTopics normalizes Korean particles and still finds employment tables", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-normalize");

  const result = await service.searchTopics("청년 고용과 실업 관련 통계를 비교해서 볼 수 있는 자료를 찾아줘", [], 5);

  assert.ok(result.queryPlan.some((item) => item.query.includes("고용 취업 실업")));
});

test("buildQueryPlan strips temporal noise and adds card usage hints", () => {
  const result = buildQueryPlan(
    "대한민국 지난 10년동안의 신용카드 사용 건수와 금액이 어떻게 변했는지 비교분석해줘",
  );

  assert.deepEqual(result.keywords, ["대한민국", "신용카드", "사용", "건수", "금액"]);
  assert.ok(
    result.queryPlan.some((item) => item.query === "신용카드 이용건수 이용금액"),
  );
  assert.ok(
    !result.queryPlan.some((item) => item.query.includes("지난 10년동안")),
  );
});

test("buildQueryPlan adds browse-oriented hints for browse questions", () => {
  const intent = inferQuestionIntent("보건 분야에서 어떤 자료가 있는지 찾아줘");
  const result = buildQueryPlan(
    "보건 분야에서 어떤 자료가 있는지 찾아줘",
    [],
    intent,
    "catalog",
  );

  assert.ok(result.queryPlan.some((item) => item.query === "보건 통계"));
  assert.ok(result.queryPlan.some((item) => item.query === "보건 분야"));
  assert.ok(result.queryPlan.some((item) => item.query === "보건 목록"));
});

test("buildQueryPlan adds explain-oriented hints for explain questions", () => {
  const intent = inferQuestionIntent("실업률이 무엇인지 설명해줘");
  const result = buildQueryPlan("실업률이 무엇인지 설명해줘", [], intent, "indicator");

  assert.ok(result.queryPlan.some((item) => item.query === "실업률 설명"));
  assert.ok(result.queryPlan.some((item) => item.query === "실업률 의미"));
  assert.ok(result.queryPlan.some((item) => item.query === "실업률 설명자료"));
});

test("buildQueryPlan separates lane-specific hints", () => {
  const intent = inferQuestionIntent("실업률이 무엇인지 설명해줘");
  const tablePlan = buildQueryPlan("실업률이 무엇인지 설명해줘", [], intent, "table");
  const indicatorPlan = buildQueryPlan(
    "실업률이 무엇인지 설명해줘",
    [],
    intent,
    "indicator",
  );

  assert.ok(tablePlan.queryPlan.some((item) => item.query === "실업률 통계표"));
  assert.ok(!tablePlan.queryPlan.some((item) => item.query === "실업률 설명자료"));
  assert.ok(indicatorPlan.queryPlan.some((item) => item.query === "실업률 설명자료"));
});

test("resolveDefaultPeriodCode honors preferred yearly period when available", () => {
  const statInfo = {
    defaultPeriodStr: "M",
    periodInfo: {
      defaultListM: ["2025.11", "2025.12", "2026.01"],
      defaultListY: ["2016", "2017", "2018", "2019", "2020"],
    },
  };

  const periodCode = resolveDefaultPeriodCode(statInfo, {
    preferredPrdSe: "Y",
    startPrdDe: "2016",
    endPrdDe: "2020",
  });

  assert.equal(periodCode, "Y");
});

test("resolvePeriodList returns ranged yearly periods and prefers latest slice", () => {
  const statInfo = {
    periodInfo: {
      defaultListY: [
        "2010",
        "2011",
        "2012",
        "2013",
        "2014",
        "2015",
        "2016",
        "2017",
        "2018",
        "2019",
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",
        "2025",
      ],
    },
  };

  const periods = resolvePeriodList(statInfo, "Y", {
    startPrdDe: "2016",
    endPrdDe: "2025",
    newEstPrdCnt: 10,
  });

  assert.deepEqual(periods, [
    "2016",
    "2017",
    "2018",
    "2019",
    "2020",
    "2021",
    "2022",
    "2023",
    "2024",
    "2025",
  ]);
});

test("resolvePeriodList falls back to listY when defaultListY is empty", () => {
  const statInfo = {
    periodInfo: {
      defaultListY: [],
      listY: [
        "2013",
        "2014",
        "2015",
        "2016",
        "2017",
        "2018",
        "2019",
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",
        "2025",
      ],
    },
  };

  const periods = resolvePeriodList(statInfo, "Y", {
    startPrdDe: "2016",
    endPrdDe: "2025",
    newEstPrdCnt: 10,
  });

  assert.deepEqual(periods, [
    "2016",
    "2017",
    "2018",
    "2019",
    "2020",
    "2021",
    "2022",
    "2023",
    "2024",
    "2025",
  ]);
});

test("resolvePeriodList expands from listY when requested count exceeds default range", () => {
  const statInfo = {
    periodInfo: {
      defaultListY: ["2025", "2024", "2023"],
      listY: [
        "2014",
        "2015",
        "2016",
        "2017",
        "2018",
        "2019",
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",
        "2025",
      ],
    },
  };

  const periods = resolvePeriodList(statInfo, "Y", {
    endPrdDe: "2024",
    newEstPrdCnt: 10,
  });

  assert.deepEqual(periods, [
    "2015",
    "2016",
    "2017",
    "2018",
    "2019",
    "2020",
    "2021",
    "2022",
    "2023",
    "2024",
  ]);
});

test("inferQuestionIntent captures yearly unemployment trend intent", () => {
  const intent = inferQuestionIntent("지난 10년 동안 대한민국의 실업률 변화를 알려달라");

  assert.deepEqual(intent.keywords, ["대한민국", "실업률"]);
  assert.deepEqual(intent.measures, ["실업률"]);
  assert.equal(intent.primaryIntent, "trend");
  assert.equal(intent.preferredPrdSe, "Y");
  assert.equal(intent.geographyScope, "national");
  assert.equal(intent.wantsIndicators, true);
  assert.ok(intent.startPrdDe);
  assert.ok(intent.endPrdDe);
});

test("inferQuestionIntent marks browse questions as browse intent", () => {
  const intent = inferQuestionIntent("보건 분야에서 어떤 자료가 있는지 찾아줘");

  assert.equal(intent.primaryIntent, "browse");
  assert.equal(intent.wantsIndicators, false);
});

test("inferQuestionIntent extracts generic comparison measures beyond hardcoded domains", () => {
  const intent = inferQuestionIntent("지난 10년간 수출 금액과 수입 금액 비교표를 보여줘");

  assert.equal(intent.primaryIntent, "compare");
  assert.ok(intent.measures.some((measure) => measure.includes("수출 금액")));
  assert.ok(intent.measures.some((measure) => measure.includes("수입 금액")));
  assert.ok(intent.targets.some((target) => target.label.includes("수출 금액")));
  assert.ok(intent.targets.some((target) => target.label.includes("수입 금액")));
});

test("inferQuestionIntent builds structured targets for complex compare questions", () => {
  const intent = inferQuestionIntent("서울과 부산의 혼인 건수, 이혼 건수, 출생아 수를 같이 비교해줘");

  assert.equal(intent.primaryIntent, "compare");
  assert.ok(intent.targets.length >= 3);
  assert.ok(intent.targets.some((target) => target.label.includes("혼인 건수")));
  assert.ok(intent.targets.some((target) => target.label.includes("이혼 건수")));
  assert.ok(intent.targets.some((target) => target.label.includes("출생아")));
});

test("scoreSearchRecord prefers direct credit card tables over tax deduction mentions", () => {
  const tokens = ["대한민국", "신용카드", "사용", "건수", "금액"];

  const direct = scoreSearchRecord(
    tokens,
    "신용카드 이용건수 이용금액",
    0,
    1,
    {
      ORG_ID: "301",
      TBL_ID: "DT_601Y003",
      TBL_NM: "신용카드",
      STAT_NM: "지급결제통계",
      MT_ATITLE: "금융 > 지급결제통계",
      CONTENTS: "전체 이용건수 전체 이용금액 개인 일반구매 이용건수 개인 일반구매 이용금액 신용카드",
      STRT_PRD_DE: "1997",
      END_PRD_DE: "2026",
    },
  );

  const distractor = scoreSearchRecord(
    tokens,
    "대한민국 신용카드 사용 건수 금액",
    0,
    0,
    {
      ORG_ID: "133",
      TBL_ID: "DT_133N_1234",
      TBL_NM: "외국인근로자 근로소득 연말정산 신고 현황",
      STAT_NM: "국세통계",
      MT_ATITLE: "정부ㆍ재정 > 국세통계",
      CONTENTS: "신용카드 소득공제 금액 인원 연말정산",
      STRT_PRD_DE: "2007",
      END_PRD_DE: "2021",
    },
  );

  assert.ok(direct.score > distractor.score);
});

test("answerBundle carries inferred preview selections into selected tables", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-answer");

  const answer = await service.answerBundle(
    "고용과 실업을 비교해서 보고 싶어",
    { comparisonMode: "pairwise", limit: 2 },
  );

  assert.equal(answer.selectedTables.length, 2);
  assert.equal(answer.selectedTables[0]?.previewRows, 1);
  assert.ok(
    answer.selectedTables.some((table) => table.previewRequest.itemId === "EMP"),
  );
  assert.ok(
    answer.selectedTables.some((table) => table.previewRequest.itemId === "UNE"),
  );
});

test("answerBundle prioritizes unemployment table for unemployment question", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-unemployment");

  const answer = await service.answerBundle("대한민국 실업률 변화를 알려달라");

  assert.equal(answer.selectedTables[0]?.tblId, "DT_TEST_B");
  assert.equal(answer.selectedIndicators[0]?.indicatorId, "1002");
  assert.ok(answer.selectedIndicators[0]?.detailRows >= 1);
  assert.ok(answer.provenance.lanes.some((lane) => lane.lane === "table-search"));
  assert.ok(
    answer.provenance.lanes.some(
      (lane) =>
        lane.lane === "indicator-search" &&
        lane.attemptCount >= 1 &&
        lane.topStrategies.length >= 1,
    ),
  );
  assert.ok(answer.provenance.selectedTables.some((entry) => entry.weightRowCount >= 1));
  assert.ok(
    answer.provenance.selectedIndicators.some(
      (entry) =>
        entry.indicatorId === "1002" &&
        entry.explanationSource === "indicatorId" &&
        entry.matchedStrategies.length >= 1,
    ),
  );
});

test("answerBundle carries catalog suggestions for browse-style questions", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-answer-catalog");

  const answer = await service.answerBundle("고용 분야에서 어떤 자료가 있는지 찾아줘");

  assert.ok(answer.selectedCatalogs.length >= 1);
  assert.ok(answer.selectedCatalogs.length >= answer.selectedIndicators.length);
  assert.ok(answer.selectedCatalogs.some((entry) => entry.listName === "고용"));
  assert.ok(answer.selectedTables.some((entry) => entry.tblId === "DT_TEST_A"));
});

test("answerBundle favors indicators over tables for explain questions", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-answer-explain");

  const answer = await service.answerBundle("실업률이 무엇인지 설명해줘");

  assert.ok(answer.selectedIndicators.length >= 1);
  assert.ok(answer.selectedTables.length <= 1);
  assert.equal(answer.selectedIndicators[0]?.indicatorId, "1002");
  assert.ok(answer.summary.headline.includes("설명 자료"));
  assert.ok(answer.summary.takeaway.includes("정의"));
  assert.ok(answer.evidence.some((entry) => entry.includes("설명 후보")));
  assert.ok(answer.nextQuestions.some((entry) => entry.includes("최근 수치")));
});

test("answerBundle can promote deep catalog tables for browse questions", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-answer-catalog-deep");

  const answer = await service.answerBundle("보건 분야에서 어떤 자료가 있는지 찾아줘");

  assert.ok(answer.selectedCatalogs.some((entry) => entry.depth === 2));
  assert.ok(answer.selectedTables.some((entry) => entry.tblId === "DT_HEALTH_A"));
  assert.ok(answer.summary.headline.includes("후속 탐색 후보"));
  assert.ok(answer.summary.takeaway.includes("통계표"));
  assert.ok(answer.evidence.some((entry) => entry.includes("카테고리")));
  assert.ok(answer.nextQuestions.some((entry) => entry.includes("더 내려가")));
});

test("answerBundle tailors trend evidence and next questions", async () => {
  const service = await createService("/tmp/kosis-question-mcp-test-answer-trend");

  const answer = await service.answerBundle("대한민국 실업률 최근 추이를 보여줘");

  assert.ok(answer.summary.headline.includes("수치/시계열 후보"));
  assert.ok(answer.summary.takeaway.includes("최신 시점"));
  assert.ok(answer.evidence.some((entry) => entry.includes("최신 시점")));
  assert.ok(answer.nextQuestions.some((entry) => entry.includes("최근 3개 시점")));
});

class CountryDefaultClient extends FakeClient {
  override async getMeta(params: { type: string; tblId?: string }): Promise<JsonRecord[]> {
    if (params.type !== "ITM") {
      return super.getMeta(params);
    }

    return [
      {
        OBJ_ID: "ITEM",
        OBJ_NM: "항목",
        ITM_ID: "T1",
        ITM_NM: "청년 실업률",
        UNIT_NM: "%",
      },
      {
        OBJ_ID: "A",
        OBJ_NM: "국가별",
        OBJ_ID_SN: "1",
        ITM_ID: "1",
        ITM_NM: "아시아",
      },
      {
        OBJ_ID: "A",
        OBJ_NM: "국가별",
        OBJ_ID_SN: "1",
        ITM_ID: "1005",
        ITM_NM: "대한민국",
      },
      {
        OBJ_ID: "A",
        OBJ_NM: "국가별",
        OBJ_ID_SN: "1",
        ITM_ID: "1010",
        ITM_NM: "아프가니스탄",
      },
      {
        OBJ_ID: "D",
        OBJ_NM: "성별",
        OBJ_ID_SN: "2",
        ITM_ID: "00",
        ITM_NM: "전체",
      },
    ];
  }

  override async getStatisticsData(params: {
    tblId: string;
    itmId?: string;
    objParams?: Record<string, string>;
  }): Promise<JsonRecord[]> {
    if (params.objParams?.objL1 === "1005") {
      return [
        {
          TBL_NM: "청년 실업률",
          C1_OBJ_NM: "국가별",
          C1_NM: "대한민국",
          ITM_NM: "청년 실업률",
          UNIT_NM: "%",
          PRD_DE: "2024",
          DT: "5.9",
        },
      ];
    }

    return [
      {
        TBL_NM: "청년 실업률",
        C1_OBJ_NM: "국가별",
        C1_NM: "아시아",
        ITM_NM: "청년 실업률",
        UNIT_NM: "%",
        PRD_DE: "2024",
        DT: "11.0",
      },
    ];
  }
}

test("getTableBundle defaults country dimensions to 대한민국 when available", async () => {
  const service = await createService(
    "/tmp/kosis-question-mcp-test-country-default",
    new CountryDefaultClient(),
  );

  const bundle = await service.getTableBundle("101", "DT_TEST_COUNTRY", "Y");

  assert.equal(bundle.dataPreview[0]?.C1_NM, "대한민국");
  assert.equal(bundle.previewRequest.attempts[0]?.objL1, "1005");
});

test("guessDefaultDimensionValue prefers 대한민국 for country dimensions", () => {
  const selected = guessDefaultDimensionValue("국가별", "A", [
    { id: "1", name: "아시아" },
    { id: "1005", name: "대한민국" },
    { id: "1010", name: "아프가니스탄" },
  ]);

  assert.equal(selected, "1005");
});

class NeetSelectionClient extends FakeClient {
  override async searchStatistics(params: { searchNm: string }): Promise<JsonRecord[]> {
    return [
      {
        ORG_ID: "101",
        ORG_NM: "통계청",
        TBL_ID: "DT_NEET",
        TBL_NM: "성별 및 연령별 교육, 취업, 직업 훈련에 참여하지 않는 청년 비율",
        STAT_ID: "STAT_NEET",
        STAT_NM: "UN",
        MT_ATITLE: "국제기구별 통계 > UN",
        STRT_PRD_DE: "2020",
        END_PRD_DE: "2024",
      },
      {
        ORG_ID: "101",
        ORG_NM: "통계청",
        TBL_ID: "DT_UNEMP",
        TBL_NM: "청년(15~24세) 실업률",
        STAT_ID: "STAT_UNEMP",
        STAT_NM: "국제통계연감",
        MT_ATITLE: "국제통계연감 > 노동",
        STRT_PRD_DE: "2020",
        END_PRD_DE: "2024",
      },
      {
        ORG_ID: "101",
        ORG_NM: "통계청",
        TBL_ID: "DT_DISTRACTOR",
        TBL_NM: "청년 실업률, 여성(15~24세 여성 경제활동인구 중 %)",
        STAT_ID: "STAT_DISTRACTOR",
        STAT_NM: "World Bank",
        MT_ATITLE: "국제기구별 통계 > World Bank",
        STRT_PRD_DE: "2020",
        END_PRD_DE: "2024",
      },
    ];
  }

  override async getMeta(params: { type: string; tblId?: string }): Promise<JsonRecord[]> {
    if (params.type !== "ITM" && params.type !== "CMMT" && params.type !== "SOURCE" && params.type !== "TBL") {
      return super.getMeta(params);
    }

    if (params.type === "TBL") {
      return [
        {
          TBL_NM:
            params.tblId === "DT_NEET"
              ? "성별 및 연령별 교육, 취업, 직업 훈련에 참여하지 않는 청년 비율"
              : params.tblId === "DT_UNEMP"
                ? "청년(15~24세) 실업률"
                : "청년 실업률, 여성(15~24세 여성 경제활동인구 중 %)",
        },
      ];
    }

    if (params.type === "ITM") {
      if (params.tblId === "DT_NEET") {
        return [
          {
            OBJ_ID: "ITEM",
            OBJ_NM: "항목",
            ITM_ID: "T1",
            ITM_NM: "성별 연령별 교육 고용 훈련에 있지 않는 청소년 비율",
            UNIT_NM: "%",
          },
          {
            OBJ_ID: "A",
            OBJ_NM: "국가별",
            OBJ_ID_SN: "1",
            ITM_ID: "1005",
            ITM_NM: "대한민국",
          },
          {
            OBJ_ID: "SEX",
            OBJ_NM: "성별",
            OBJ_ID_SN: "2",
            ITM_ID: "TOT",
            ITM_NM: "전체",
          },
        ];
      }

      return [
        {
          OBJ_ID: "ITEM",
          OBJ_NM: "항목",
          ITM_ID: params.tblId === "DT_UNEMP" ? "T10" : "T20",
          ITM_NM:
            params.tblId === "DT_UNEMP"
              ? "15~24세 실업률"
              : "청년 실업률 여성(15~24세 여성 경제활동인구 중 %)",
          UNIT_NM: "%",
        },
        {
          OBJ_ID: "A",
          OBJ_NM: "국가별",
          OBJ_ID_SN: "1",
          ITM_ID: "1005",
          ITM_NM: "대한민국",
        },
        {
          OBJ_ID: "SEX",
          OBJ_NM: "성별",
          OBJ_ID_SN: "2",
          ITM_ID: "TOT",
          ITM_NM: "전체",
        },
      ];
    }

    if (params.type === "CMMT") {
      if (params.tblId === "DT_NEET") {
        return [{ CMMT_NM: "통계표", CMMT_DC: "15~24세 청년 중 교육, 고용, 훈련에 모두 참여하지 않는 NEET 인구의 비율이다." }];
      }
      return [{ CMMT_NM: "통계표", CMMT_DC: "청년 실업률이다." }];
    }

    if (params.type === "SOURCE") {
      return [
        {
          JOSA_NM:
            params.tblId === "DT_NEET"
              ? "UN"
              : params.tblId === "DT_UNEMP"
                ? "국제통계연감"
                : "World Bank",
          STAT_ID:
            params.tblId === "DT_NEET"
              ? "STAT_NEET"
              : params.tblId === "DT_UNEMP"
                ? "STAT_UNEMP"
                : "STAT_DISTRACTOR",
        },
      ];
    }

    return super.getMeta(params);
  }

  override async getExplanation(params: { statId?: string }): Promise<JsonRecord[]> {
    if (params.statId === "STAT_NEET") {
      return [{ statsNm: "NEET 관련 통계" }];
    }
    return super.getExplanation(params);
  }

  override async getStatisticsData(params: {
    tblId: string;
    itmId?: string;
    objParams?: Record<string, string>;
  }): Promise<JsonRecord[]> {
    return [
      {
        TBL_NM: params.tblId,
        C1_OBJ_NM: "국가별",
        C1_NM: "대한민국",
        ITM_NM: params.tblId === "DT_NEET" ? "NEET" : "실업률",
        UNIT_NM: "%",
        PRD_DE: "2024",
        DT: params.tblId === "DT_NEET" ? "13.6" : "5.9",
      },
    ];
  }
}

test("answerBundle prioritizes NEET tables when the question asks for NEET comparison", async () => {
  const service = await createService(
    "/tmp/kosis-question-mcp-test-neet-selection",
    new NeetSelectionClient(),
  );

  const answer = await service.answerBundle(
    "NEET 비율과 청년 실업률을 같이 비교할 수 있는 표를 묶어줘",
    { comparisonMode: "pairwise", limit: 3 },
  );

  assert.ok(answer.selectedTables.some((table) => table.tblId === "DT_NEET"));
  assert.ok(answer.selectedTables.some((table) => table.tblId === "DT_UNEMP"));
  assert.ok(!answer.selectedTables.some((table) => table.tblId === "DT_DISTRACTOR"));
});

test("filterRowsToSelectedClasses keeps only rows matching selected country labels", () => {
  const rows = [
    {
      tableKey: "101:DT_2UNS0197",
      "2) 국가(1)": "아시아",
      "2) 국가(2)": "키프로스",
      "성별": "전체",
      "2023": "13.6",
    },
    {
      tableKey: "101:DT_2UNS0197",
      "2) 국가(1)": "",
      "2) 국가(2)": "대한민국",
      "성별": "전체",
      "2023": "7.1",
    },
    {
      tableKey: "101:DT_2UNS0197",
      "2) 국가(1)": "",
      "2) 국가(2)": "",
      "성별": "남자",
      "2023": "6.5",
    },
  ];
  const statInfo = {
    classInfoList: [
      {
        classId: "2UNS",
        classNm: "국가",
        sn: "1",
        itmList: [
          { itmId: "1055", scrKor: "키프로스" },
          { itmId: "1005", scrKor: "대한민국" },
        ],
      },
      {
        classId: "SBB",
        classNm: "성별",
        sn: "2",
        itmList: [
          { itmId: "0", scrKor: "전체" },
          { itmId: "1", scrKor: "남자" },
        ],
      },
    ],
  };

  const filtered = filterRowsToSelectedClasses(
    rows,
    ["tableKey", "2) 국가(1)", "2) 국가(2)", "성별", "2023"],
    statInfo,
    [
      {
        classId: "2UNS",
        values: ["1", "1005"],
        filterValues: ["1005"],
        levelGroups: [
          { level: 1, values: ["1"] },
          { level: 2, values: ["1005"] },
        ],
        sn: "1",
      },
      {
        classId: "SBB",
        values: ["0"],
        filterValues: ["0"],
        levelGroups: [{ level: 1, values: ["0"] }],
        sn: "2",
      },
    ],
  );

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.["2) 국가(2)"], "대한민국");
});
