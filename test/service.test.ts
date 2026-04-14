import test from "node:test";
import assert from "node:assert/strict";
import { FileCache } from "../src/kosis/cache.js";
import { filterRowsToSelectedClasses } from "../src/kosis/html-fallback.js";
import { KosisService } from "../src/kosis/service.js";
import type { JsonRecord } from "../src/kosis/types.js";
import { guessDefaultDimensionValue } from "../src/kosis/utils.js";

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
  const cache = new FileCache("/tmp/kosis-question-mcp-test-country-default", 10_000);
  await cache.clearAll();
  const service = new KosisService(
    new CountryDefaultClient() as never,
    cache,
    5,
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
  const cache = new FileCache("/tmp/kosis-question-mcp-test-neet-selection", 10_000);
  await cache.clearAll();
  const service = new KosisService(
    new NeetSelectionClient() as never,
    cache,
    5,
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
      { classId: "2UNS", values: ["1", "1005"], filterValues: ["1005"], sn: "1" },
      { classId: "SBB", values: ["0"], filterValues: ["0"], sn: "2" },
    ],
  );

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.["2) 국가(2)"], "대한민국");
});
