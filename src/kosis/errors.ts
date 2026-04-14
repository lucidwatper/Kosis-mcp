const KOSIS_ERROR_MAP: Record<string, string> = {
  "10": "인증키 누락",
  "11": "인증키 기간만료",
  "20": "필수 파라미터 누락",
  "21": "필수 파라미터 오류",
  "22": "허용되지 않은 파라미터",
  "30": "조회 결과 없음",
  "31": "조회결과 초과",
  "40": "호출 가능 건수 제한",
  "41": "호출 가능 ROW 수 제한",
  "42": "사용자별 이용 제한",
  "50": "서버 오류",
};

export class KosisApiError extends Error {
  public readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "KosisApiError";
    this.code = code;
  }
}

export function mapKosisError(code?: string): string | undefined {
  if (!code) {
    return undefined;
  }
  return KOSIS_ERROR_MAP[code];
}
