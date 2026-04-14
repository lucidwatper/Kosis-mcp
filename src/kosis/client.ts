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
  type: "TBL" | "ORG" | "PRD" | "ITM" | "CMMT" | "UNIT" | "SOURCE" | "NCD";
  orgId: string;
  tblId?: string;
  objId?: string;
  itmId?: string;
  prdSe?: string;
  detail?: string;
}

export interface ExplanationRequestParams {
  statId?: string;
  orgId?: string;
  tblId?: string;
  metaItm?: string;
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
}
