# KOSIS MCP

**국가통계포털(KOSIS) 자료를 AI에서 바로 찾고, 묶고, 비교할 수 있게 만드는 MCP 서버입니다.**  
질문형 탐색, 통계표 번들링, 메타자료 결합, 비교분석 초안 생성, 그리고 일부 표에 대한 HTML fallback preview까지 지원합니다.

이 프로젝트는 Claude, Cursor 같은 AI 도구에서 KOSIS를 더 쉽게 쓰도록 만든 서버입니다.

## 이런 식으로 씁니다

그냥 자연어로 물어보면 됩니다.

- `요즘 고용 상황이 어떤지 알고 싶어`
- `청년 고용과 실업 관련 통계를 비교해서 볼 수 있는 자료를 찾아줘`
- `15-29세 고용률 추이를 최근 3개 시점으로 보고 싶어`
- `NEET 비율과 청년 실업률을 같이 비교할 수 있는 표를 묶어줘`

서버는 질문을 기준으로:

- 관련 통계표 후보를 찾고
- 메타자료와 설명자료를 붙이고
- 비교 가능한 표를 골라주고
- 가능한 경우 실제 preview 수치까지 가져옵니다

## 지원 방식

이 서버는 두 방식으로 쓸 수 있습니다.

- 로컬 `stdio` MCP
- 원격 `Streamable HTTP` MCP

즉:

- 내 컴퓨터에서 직접 실행할 수도 있고
- Render/Fly 같은 곳에 올려서 URL로 바로 붙일 수도 있습니다

## API 키 방식

사용자 KOSIS 키는 두 방식으로 전달할 수 있습니다.

### 1. 권장 방식: 헤더

가장 안전한 방식입니다.

- `X-Kosis-Api-Key: <내 KOSIS 키>`

서버 보호 토큰을 쓸 경우에는 이것도 함께 넣습니다.

- `Authorization: Bearer <MCP_SERVER_TOKEN>`

### 2. 간편 방식: URL 쿼리

가장 쉽게 붙일 수 있는 방식입니다.

- `https://YOUR-SERVER/mcp?oc=내KOSIS키`

이 방식은 사용은 쉽지만, **URL에 키가 남을 수 있으므로 보안상 권장하지는 않습니다.**  
그래도 Claude 커스텀 커넥터처럼 URL만 넣는 방식에는 매우 편합니다.

정리하면:

- **가장 쉬움**: `?oc=...`
- **가장 권장**: `X-Kosis-Api-Key` 헤더

## 설치 및 사용법

### 방법 1: Claude.ai 웹에서 바로 사용

설치 없이 원격 URL만 넣어 쓰는 가장 쉬운 방식입니다.

커스텀 커넥터 URL 예시:

```text
https://YOUR-RENDER-URL.onrender.com/mcp?oc=YOUR_KOSIS_API_KEY
```

이 방식은 가장 간단하지만, URL에 키가 들어가므로 개인 환경에서만 쓰는 것을 권장합니다.

### 방법 2: Cursor / Claude Desktop / 기타 데스크톱 앱에서 원격으로 사용

헤더를 넣을 수 있는 클라이언트라면 이 방식이 더 좋습니다.

Cursor/유사 클라이언트 예시:

```json
{
  "mcpServers": {
    "kosis-remote": {
      "url": "https://YOUR-RENDER-URL.onrender.com/mcp",
      "headers": {
        "X-Kosis-Api-Key": "YOUR_KOSIS_API_KEY"
      }
    }
  }
}
```

서버 접근 토큰까지 쓸 경우:

```json
{
  "mcpServers": {
    "kosis-remote": {
      "url": "https://YOUR-RENDER-URL.onrender.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_SERVER_TOKEN",
        "X-Kosis-Api-Key": "YOUR_KOSIS_API_KEY"
      }
    }
  }
}
```

### 방법 3: 내 컴퓨터에서 직접 실행

Node.js 22 이상 기준입니다.

1. 의존성 설치

```bash
npm install
```

2. `.env` 파일 준비

`.env.example`을 복사해서 `.env`를 만들고, 값을 채웁니다.

```bash
KOSIS_API_KEY=YOUR_KOSIS_API_KEY
```

3. 빌드

```bash
npm run build
```

4. 실행

```bash
npm start
```

로컬 `stdio` 예시 설정은 `codex-mcp.config.example.json`에 있습니다.

## Render로 배포하기

이 저장소는 Render 웹 서비스 배포를 바로 할 수 있게 준비돼 있습니다.

### build / start

- Build Command

```bash
npm install --include=dev && npm run build
```

- Start Command

```bash
npm start
```

- Health Check Path

```text
/healthz
```

### Render 환경변수

필수/권장 값:

```bash
HOST=0.0.0.0
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false
KOSIS_CACHE_DIR=/tmp/kosis-mcp-cache
KOSIS_CACHE_TTL_MS=21600000
KOSIS_TIMEOUT_MS=20000
KOSIS_DEFAULT_LIMIT=5
```

선택:

```bash
MCP_SERVER_TOKEN=랜덤긴문자열
```

설명:

- `MCP_SERVER_TOKEN`을 넣으면 서버 접근 시 `Authorization: Bearer ...`가 필요합니다.
- 넣지 않으면 공개형 BYOK 서버처럼 동작합니다.
- Render에는 **사용자 KOSIS 키를 저장하지 않아도 됩니다.**

Render Blueprint 예시는 `render.yaml`에 있습니다.

## 주요 도구

- `kosis_search_topics`
  - 질문을 검색 질의로 쪼개고 관련 통계표 후보를 점수화합니다.

- `kosis_get_table_bundle`
  - 특정 표의 메타자료, 설명자료, preview, 선택 가능한 차원 정보를 묶어줍니다.

- `kosis_compare_tables`
  - 여러 표를 비교 가능한 축으로 정리합니다.

- `kosis_answer_bundle`
  - 질문 하나로 관련 표 탐색 + 번들링 + 비교 초안까지 수행합니다.

## 구현 특징

- KOSIS 검색 결과 기반 관련 표 추천
- 메타자료 / 통계설명 결합
- 차원 선택(`itemSelection`, `dimensionSelections`) 지원
- 일부 표에 대해 OpenAPI preview 실패 시 KOSIS HTML fallback 사용
- 로컬 캐시 지원
- Render용 HTTP 모드와 로컬 `stdio` 모드 동시 지원

## 보안 메모

- 저장소에는 실제 KOSIS 키를 넣지 마세요.
- `.env`는 커밋하지 마세요.
- `?oc=` 방식은 편하지만 URL 노출 위험이 있습니다.
- 보안이 중요하면 헤더 방식을 쓰세요.

## 개발

```bash
npm run typecheck
npm test
```

## 라이선스

필요하면 이후에 추가하세요.
