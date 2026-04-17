import type { KosisConfig } from "../config.js";
import { KosisApiError, mapKosisError } from "./errors.js";
import type { JsonRecord } from "./types.js";
import { coerceRecordArray } from "./utils.js";

export interface SearchStatisticsParams {
  searchNm: string;
  sort?: "RANK" | "DATE";
  startCount?: number;
  resultCount?: number;
}

export interface DataRequestParams {
  orgId: string;
  tblId: string;
  prdSe: string;
  itmId?: string;
  newEstPrdCnt?: number;
  startPrdDe?: string;
  endPrdDe?: string;
  prdInterval?: number;
  objParams?: Record<string, string>;
}

export interface MetaRequestParams {
  type: "TBL" | "ORG" | "PRD" | "ITM" | "CMMT" | "UNIT" | "SOURCE" | "NCD" | "WGT";
  orgId: string;
  tblId?: string;
  objId?: string;
  itmId?: string;
  prdSe?: string;
  detail?: string;
  extraParams?: Record<string, string>;
}

export interface ExplanationRequestParams {
  statId?: string;
  orgId?: string;
  tblId?: string;
  metaItm?: string;
}

export interface IndicatorLookupParams {
  indicatorId?: string;
  indicatorName?: string;
  pageNo?: number;
  numOfRows?: number;
}

export interface IndicatorDetailParams extends IndicatorLookupParams {
  startPrdDe?: string;
  endPrdDe?: string;
  rn?: number;
  srvRn?: number;
}

export interface IndicatorListByListIdParams {
  listId: string;
  pageNo?: number;
  numOfRows?: number;
}

export interface IndicatorListByPeriodParams {
  prdSe: string;
  pageNo?: number;
  numOfRows?: number;
}

export interface CatalogRequestParams {
  vwCd: string;
  parentListId: string;
}

export class KosisClient {
  constructor(public readonly config: KosisConfig) {}

  private parseLegacyPayload(text: string): unknown {
    const trimmed = text.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      throw new KosisApiError(`KOSIS returned a non-JSON payload: ${text.slice(0, 200)}`);
    }

    try {
      return Function(`"use strict"; return (${trimmed});`)() as unknown;
    } catch {
      throw new KosisApiError(`KOSIS returned a non-JSON payload: ${text.slice(0, 200)}`);
    }
  }

  private buildUrl(endpoint: string, params: Record<string, string>): URL {
    const url = new URL(endpoint, this.config.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== "") {
        url.searchParams.set(key, value);
      }
    }
    return url;
  }

  private extractKosisError(payload: unknown): KosisApiError | null {
    const records = coerceRecordArray(payload);
    if (records.length === 0) {
      return null;
    }

    const candidate = records[0];
    const codeKeys = ["errCd", "errorCode", "ERROR_CODE", "code"];
    const messageKeys = ["errMsg", "errorMessage", "ERROR_MSG", "message"];

    const code = codeKeys
      .map((key) => candidate[key])
      .find((value): value is string => typeof value === "string");
    const message = messageKeys
      .map((key) => candidate[key])
      .find((value): value is string => typeof value === "string");

    if (!code && !message) {
      return null;
    }

    return new KosisApiError(message ?? mapKosisError(code) ?? "KOSIS API error", code);
  }

  private async requestJson(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<JsonRecord[]> {
    if (!this.config.apiKey) {
      throw new KosisApiError(
        "KOSIS API key is missing. Provide KOSIS_API_KEY or X-Kosis-Api-Key.",
      );
    }

    const url = this.buildUrl(endpoint, {
      apiKey: this.config.apiKey,
      format: "json",
      content: "json",
      ...params,
    });

    const response = await fetch(url, {
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new KosisApiError(
        `KOSIS request failed with status ${response.status}: ${text}`,
      );
    }

    let parsed: unknown;
    try {
      parsed = text ? (JSON.parse(text) as unknown) : [];
    } catch {
      parsed = this.parseLegacyPayload(text);
    }

    const error = this.extractKosisError(parsed);
    if (error) {
      throw error;
    }

    return coerceRecordArray(parsed);
  }

  async searchStatistics(params: SearchStatisticsParams): Promise<JsonRecord[]> {
    return this.requestJson("/openapi/statisticsSearch.do", {
      method: "getList",
      searchNm: params.searchNm,
      sort: params.sort ?? "RANK",
      startCount: String(params.startCount ?? 1),
      resultCount: String(params.resultCount ?? 10),
    });
  }

  async getStatisticsData(params: DataRequestParams): Promise<JsonRecord[]> {
    const objParams = params.objParams ?? { objL1: "all" };

    return this.requestJson("/openapi/statisticsData.do", {
      method: "getList",
      orgId: params.orgId,
      tblId: params.tblId,
      itmId: params.itmId ?? "all",
      prdSe: params.prdSe,
      newEstPrdCnt: String(params.newEstPrdCnt ?? 5),
      prdInterval: String(params.prdInterval ?? 1),
      jsonVD: "Y",
      ...(params.startPrdDe ? { startPrdDe: params.startPrdDe } : {}),
      ...(params.endPrdDe ? { endPrdDe: params.endPrdDe } : {}),
      ...objParams,
    });
  }

  async getMeta(params: MetaRequestParams): Promise<JsonRecord[]> {
    return this.requestJson("/openapi/statisticsData.do", {
      method: "getMeta",
      type: params.type,
      orgId: params.orgId,
      ...(params.tblId ? { tblId: params.tblId } : {}),
      ...(params.objId ? { objId: params.objId } : {}),
      ...(params.itmId ? { itmId: params.itmId } : {}),
      ...(params.prdSe ? { prdSe: params.prdSe } : {}),
      ...(params.detail ? { detail: params.detail } : {}),
      ...(params.extraParams ?? {}),
    });
  }

  async getExplanation(params: ExplanationRequestParams): Promise<JsonRecord[]> {
    if (!params.statId && !(params.orgId && params.tblId)) {
      throw new KosisApiError(
        "Explanation lookup requires either statId or both orgId and tblId.",
      );
    }

    return this.requestJson("/openapi/statisticsExplData.do", {
      method: "getList",
      metaItm: params.metaItm ?? "All",
      ...(params.statId ? { statId: params.statId } : {}),
      ...(params.orgId ? { orgId: params.orgId } : {}),
      ...(params.tblId ? { tblId: params.tblId } : {}),
    });
  }

  async getIndicatorExplanationById(
    params: Required<Pick<IndicatorLookupParams, "indicatorId">> &
      Omit<IndicatorLookupParams, "indicatorName">,
  ): Promise<JsonRecord[]> {
    return this.requestJson("/openapi/pkNumberService.do", {
      method: "getList",
      service: "1",
      serviceDetail: "pkAll",
      jipyoId: params.indicatorId,
      pageNo: String(params.pageNo ?? 1),
      numOfRows: String(params.numOfRows ?? 10),
    });
  }

  async getIndicatorExplanationByName(
    params: Required<Pick<IndicatorLookupParams, "indicatorName">> &
      Omit<IndicatorLookupParams, "indicatorId">,
  ): Promise<JsonRecord[]> {
    return this.requestJson("/openapi/indExpService.do", {
      method: "getList",
      service: "2",
      serviceDetail: "indAll",
      jipyoNm: params.indicatorName,
      pageNo: String(params.pageNo ?? 1),
      numOfRows: String(params.numOfRows ?? 10),
    });
  }

  async getIndicatorsByListId(
    params: IndicatorListByListIdParams,
  ): Promise<JsonRecord[]> {
    return this.requestJson("/openapi/indiListService.do", {
      method: "getList",
      service: "3",
      listId: params.listId,
      pageNo: String(params.pageNo ?? 1),
      numOfRows: String(params.numOfRows ?? 10),
    });
  }

  async searchIndicatorLists(params: IndicatorLookupParams): Promise<JsonRecord[]> {
    if (!params.indicatorId && !params.indicatorName) {
      throw new KosisApiError(
        "Indicator list search requires indicatorId or indicatorName.",
      );
    }

    return this.requestJson("/openapi/indListSearchRequest.do", {
      method: "getList",
      service: "4",
      serviceDetail: "indList",
      ...(params.indicatorId ? { jipyoId: params.indicatorId } : {}),
      ...(params.indicatorName ? { jipyoNm: params.indicatorName } : {}),
      pageNo: String(params.pageNo ?? 1),
      numOfRows: String(params.numOfRows ?? 10),
    });
  }

  async getIndicatorDetailById(
    params: Required<Pick<IndicatorDetailParams, "indicatorId">> &
      Omit<IndicatorDetailParams, "indicatorName">,
  ): Promise<JsonRecord[]> {
    return this.requestJson("/openapi/indIdDetailSearchRequest.do", {
      method: "getList",
      service: "4",
      serviceDetail: "indIdDetail",
      jipyoId: params.indicatorId,
      ...(params.startPrdDe ? { startPrdDe: params.startPrdDe } : {}),
      ...(params.endPrdDe ? { endPrdDe: params.endPrdDe } : {}),
      ...(params.rn ? { rn: String(params.rn) } : {}),
      ...(params.srvRn ? { srvRn: String(params.srvRn) } : {}),
      pageNo: String(params.pageNo ?? 1),
      numOfRows: String(params.numOfRows ?? 10),
    });
  }

  async getIndicatorDetailByName(
    params: Required<Pick<IndicatorDetailParams, "indicatorName">> &
      Omit<IndicatorDetailParams, "indicatorId">,
  ): Promise<JsonRecord[]> {
    return this.requestJson("/openapi/indDetailSearchRequest.do", {
      method: "getList",
      service: "4",
      serviceDetail: "indDetail",
      jipyoNm: params.indicatorName,
      ...(params.startPrdDe ? { startPrdDe: params.startPrdDe } : {}),
      ...(params.endPrdDe ? { endPrdDe: params.endPrdDe } : {}),
      ...(params.rn ? { rn: String(params.rn) } : {}),
      ...(params.srvRn ? { srvRn: String(params.srvRn) } : {}),
      pageNo: String(params.pageNo ?? 1),
      numOfRows: String(params.numOfRows ?? 10),
    });
  }

  async getIndicatorsByPeriod(
    params: IndicatorListByPeriodParams,
  ): Promise<JsonRecord[]> {
    return this.requestJson("/openapi/prListSearchRequest.do", {
      method: "getList",
      service: "4",
      serviceDetail: "prList",
      prdSe: params.prdSe,
      pageNo: String(params.pageNo ?? 1),
      numOfRows: String(params.numOfRows ?? 10),
    });
  }

  async getStatisticsList(params: CatalogRequestParams): Promise<JsonRecord[]> {
    return this.requestJson("/openapi/statisticsList.do", {
      method: "getList",
      vwCd: params.vwCd,
      parentListId: params.parentListId,
      jsonVD: "Y",
    });
  }
}
