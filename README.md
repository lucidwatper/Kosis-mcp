# KOSIS MCP

**국가통계포털(KOSIS) 자료를 AI에서 바로 찾고, 묶고, 비교할 수 있게 해주는 MCP 서버입니다.**

Codex, Claude, Cursor 같은 AI 도구에서 통계청 자료를 더 쉽게 찾고 볼 수 있습니다.

## 바로 이런 식으로 씁니다

그냥 한국어로 물어보면 됩니다.

* `요즘 고용 상황이 어떤지 알고 싶어`
* `청년 고용과 실업 관련 통계를 비교해서 볼 수 있는 자료를 찾아줘`
* `15~29세 고용률 추이를 최근 3개 시점으로 보고 싶어`
* `NEET 비율과 청년 실업률을 같이 비교할 수 있는 표를 묶어줘`

질문하면 이 서버가 알아서:

* 관련 통계표를 찾고
* 설명자료와 메타자료를 붙이고
* 비교할 만한 표를 추리고
* 가능한 경우 preview 수치까지 보여줍니다

## 왜 편한가

* 통계표 ID를 몰라도 됩니다
* 한국어로 바로 찾을 수 있습니다
* 관련 표를 한 번에 묶어줍니다
* 비교할 만한 자료를 자동으로 골라줍니다
* 일부 표는 preview 수치도 바로 볼 수 있습니다

## 바로 붙이는 방법

### 1) Claude.ai에서 가장 쉽게 쓰기

커스텀 커넥터 URL에 아래처럼 넣으면 됩니다.

```text
https://kosis-mcp-70b9.onrender.com/mcp?oc=YOUR_KOSIS_API_KEY
```

가장 간단한 방식입니다.

### 2) Cursor / Codex / Claude Desktop에서 쓰기

MCP 설정에 아래처럼 추가하면 됩니다.

```json
{
  "mcpServers": {
    "kosis-remote": {
      "url": "https://kosis-mcp-70b9.onrender.com/mcp",
      "headers": {
        "X-Kosis-Api-Key": "YOUR_KOSIS_API_KEY"
      }
    }
  }
}
```

헤더를 넣을 수 있는 환경이라면 이 방식이 가장 깔끔합니다.

### 3) 내 컴퓨터에서 직접 실행하기

Node.js 22 이상 기준입니다.

```bash
npm install
npm run build
npm start
```

`.env` 파일에는 아래처럼 넣으면 됩니다.

```bash
KOSIS_API_KEY=YOUR_KOSIS_API_KEY
```

## 이 서버가 해주는 일

* 질문형 통계 탐색
* 관련 표/설명자료/메타자료 결합
* 비교분석용 표 추천
* 선택형 preview
* 일부 표의 HTML fallback preview
* 로컬 `stdio` + 원격 `Streamable HTTP` 지원

## 한 줄 정리

**KOSIS를 AI에서 사람 말로 바로 찾고, 비교하고, 묶어보게 해주는 MCP 서버입니다.**

## 개발

```bash
npm run typecheck
npm test
```

## 라이선스

MIT
