# KOSIS Question MCP

KOSIS OpenAPI를 기반으로 질문형 탐색, 통계표 번들링, 비교분석 초안 생성을 제공하는 로컬 `stdio` MCP 서버입니다.

## Features

- 자연어 질문을 KOSIS 검색 질의로 분해하고 관련 통계표 후보를 점수화
- 특정 통계표에 대해 통계자료 preview, 메타자료, 통계설명 번들 제공
- 여러 통계표를 공통 차원과 단위 기준으로 비교 가능한 구조로 정리
- 검색 결과/메타/설명자료 파일 캐시

## Environment

`.env` 또는 실행 환경변수로 아래 값을 제공합니다.

```bash
KOSIS_API_KEY=your-api-key
KOSIS_BASE_URL=https://kosis.kr
KOSIS_CACHE_DIR=.cache/kosis-mcp
KOSIS_CACHE_TTL_MS=21600000
KOSIS_TIMEOUT_MS=20000
KOSIS_DEFAULT_LIMIT=5
KOSIS_CACHE_CLEAR_ON_START=0
```

## Install

```bash
npm install
npm run build
```

## Run

```bash
npm start
```

Before running, edit `/Users/gglee/Documents/new/.env` and replace `PUT_YOUR_KOSIS_API_KEY_HERE` with your real key.

For MCP client registration, a ready-to-edit example is available at `/Users/gglee/Documents/new/codex-mcp.config.example.json`.

## Render Deploy

This project supports two transport modes:

- `stdio` for local desktop MCP clients
- `http` for remote deployment on platforms like Render

Remote mode uses bring-your-own KOSIS API keys. The server itself should not store end-user KOSIS keys.

### Required headers in HTTP mode

- `Authorization: Bearer <MCP_SERVER_TOKEN>`
- `X-Kosis-Api-Key: <user-kosis-api-key>`

### Required environment variables in HTTP mode

```bash
MCP_TRANSPORT=http
HOST=0.0.0.0
PORT=10000
MCP_SERVER_TOKEN=your-random-server-token
```

Render Blueprint example is included in `/Users/gglee/Documents/new/render.yaml`.

## Tools

- `kosis_search_topics`
- `kosis_get_table_bundle`
- `kosis_compare_tables`
- `kosis_answer_bundle`
