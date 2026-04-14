# KOSIS MCP

**국가통계포털(KOSIS) 자료를 AI에서 바로 찾고, 묶고, 비교할 수 있게 해주는 MCP 서버입니다.**

Codex, Claude, Cursor 같은 AI 도구에서 통계청 자료를 더 쉽게 찾고 볼 수 있습니다.

## 이런 식으로 씁니다

문장으로 물어보면 됩니다.

* `요즘 고용 상황이 어떤지 알고 싶어`
* `청년 고용과 실업 관련 통계를 비교해서 볼 수 있는 자료를 찾아줘`
* `15~29세 고용률 추이를 최근 3개 시점으로 보고 싶어`
* `NEET 비율과 청년 실업률을 같이 비교할 수 있는 표를 묶어줘`

질문하면 이 서버가 알아서:

* 관련 통계표를 찾고
* 설명자료와 메타자료를 붙이고
* 비교할 만한 표를 추리고
* 가능한 경우 preview 수치까지 보여줍니다

## 바로 붙이는 방법

### 1) Codex, Claude.ai에서 가장 쉽게 쓰기

스트리밍 가능한 HTTP URL, 커스텀 커넥터 URL에 아래처럼 넣으면 됩니다.

```text
https://kosis-mcp-70b9.onrender.com/mcp?oc=YOUR_KOSIS_API_KEY
```

### 2) Cursor/ Claude Desktop에서 쓰기

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

### 3) 내 컴퓨터에 내려받아 직접 실행하기

Node.js 22 이상 기준입니다.

```bash
git clone https://github.com/lucidwatper/Kosis-mcp.git
cd Kosis-mcp
npm install
npm run build
npm start
```

실행 전에 `.env` 파일을 하나 만들고 아래처럼 넣으면 됩니다.

```bash
KOSIS_API_KEY=YOUR_KOSIS_API_KEY
```

## 라이선스

MIT
