import test from "node:test";
import assert from "node:assert/strict";
import { FileCache } from "../src/kosis/cache.js";
import { KosisService } from "../src/kosis/service.js";
import type { JsonRecord } from "../src/kosis/types.js";

class FakeClient {
  async searchStatistics(params: { searchNm: string }): Promise<JsonRecord[]> {
    if (params.searchNm.includes("없는")) {
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
        return [{ TBL_NM: params.tblId === "DT_TEST_A" ? "고용률" : "실업률" }];
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
            ITM_ID: params.tblId === "DT_TEST_A" ? "EMP" : "UNE",
            ITM_NM: params.tblId === "DT_TEST_A" ? "고용률" : "실업률",
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
        return [{ JOSA_NM: "경제활동인구조사", STAT_ID: params.tblId === "DT_TEST_A" ? "STAT_A" : "STAT_B" }];
      case "NCD":
        return [{ PRD_SE: "Y", PRD_DE: "2024", SEND_DE: "20250101" }];
      default:
        return [];
    }
  }

  async getExplanation(params: { statId?: string }): Promise<JsonRecord[]> {
    return [{ statsNm: params.statId === "STAT_A" ? "경제활동인구조사 A" : "경제활동인구조사 B" }];
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
        TBL_NM: params.tblId === "DT_TEST_A" ? "고용률" : "실업률",
        C1_OBJ_NM: "지역",
        C1_NM: "전국",
        ITM_NM: params.tblId === "DT_TEST_A" ? "고용률" : "실업률",
        UNIT_NM: "%",
        PRD_DE: "2024",
        DT: params.tblId === "DT_TEST_A" ? "62.7" : "2.9",
      },
    ];
  }
}

test("searchTopics returns ranked results and query plan", async () => {
  const cache = new FileCache("/tmp/kosis-question-mcp-test-search", 10_000);
  await cache.clearAll();
  const service = new KosisService(
    new FakeClient() as never,
    cache,
    5,
  );

  const result = await service.searchTopics("고용 상황이 궁금해", [], 5);

  assert.ok(result.queryPlan.length >= 1);
  assert.equal(result.results[0]?.tblId, "DT_TEST_A");
  assert.ok(result.results[0]?.whyMatched.length);
});

test("getTableBundle combines preview, meta and explanation", async () => {
  const cache = new FileCache("/tmp/kosis-question-mcp-test-bundle", 10_000);
  await cache.clearAll();
  const service = new KosisService(
    new FakeClient() as never,
    cache,
    5,
  );

  const bundle = await service.getTableBundle("101", "DT_TEST_A", "Y");

  assert.equal(bundle.table.title, "고용률");
  assert.equal(bundle.meta.source[0]?.STAT_ID, "STAT_A");
  assert.equal(bundle.dataPreview.length, 1);
  assert.equal(bundle.explanation?.statsNm, "경제활동인구조사 A");
  assert.equal(bundle.previewGuide.dimensions.length, 2);
});

test("compareTables exposes shared dimensions and units", async () => {
  const cache = new FileCache("/tmp/kosis-question-mcp-test-compare", 10_000);
  await cache.clearAll();
  const service = new KosisService(
    new FakeClient() as never,
    cache,
    5,
  );

  const comparison = await service.compareTables([
    { orgId: "101", tblId: "DT_TEST_A" },
    { orgId: "101", tblId: "DT_TEST_B" },
  ]);

  assert.ok(comparison.commonDimensions.includes("지역"));
  assert.ok(comparison.summary.comparable);
  assert.equal(comparison.tables.length, 2);
});

test("getTableBundle supports explicit dimension selections for preview retries", async () => {
  const cache = new FileCache("/tmp/kosis-question-mcp-test-selection", 10_000);
  await cache.clearAll();
  const service = new KosisService(
    new FakeClient() as never,
    cache,
    5,
  );

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

test("searchTopics normalizes Korean particles and still finds employment tables", async () => {
  const cache = new FileCache("/tmp/kosis-question-mcp-test-normalize", 10_000);
  await cache.clearAll();
  const service = new KosisService(
    new FakeClient() as never,
    cache,
    5,
  );

  const result = await service.searchTopics("청년 고용과 실업 관련 통계를 비교해서 볼 수 있는 자료를 찾아줘", [], 5);

  assert.ok(result.queryPlan.some((item) => item.query.includes("고용 취업 실업")));
});

test("answerBundle carries inferred preview selections into selected tables", async () => {
  const cache = new FileCache("/tmp/kosis-question-mcp-test-answer", 10_000);
  await cache.clearAll();
  const service = new KosisService(
    new FakeClient() as never,
    cache,
    5,
  );

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
