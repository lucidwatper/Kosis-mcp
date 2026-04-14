# KOSIS 공유서비스(OpenAPI) 개발가이드

- Source PDF: `/Users/gglee/Downloads/openApi_manual_v1.0.pdf`
- Generated for LLM reading: `2026-04-13`
- Notes: header/footer removed where possible; section headings and code blocks normalized; some tables remain flattened from the original PDF extraction.

## 목차

- `1` KOSIS 공유서비스(OpenAPI) 개요 (p. 5)
- `1.1` 제공 콘텐츠 (p. 6)
- `1.1.1` 통계목록 (p. 6)
- `1.1.2` 통계자료 (p. 7)
- `1.1.3` 대용량 통계자료 (p. 8)
- `1.1.4` 통계설명 (p. 9)
- `1.1.5` 메타자료 (p. 10)
- `1.1.6` KOSIS통합검색 (p. 11)
- `1.1.7` 통계주요지표 (p. 12)
- `1.2` 회원가입 (p. 13)
- `1.3` 인증키 발급 (p. 14)
- `1.3.1` 활용신청 (p. 14)
- `1.3.2` 신청현황 (p. 15)
- `1.4` 에러메시지 (p. 16)
- `1.4.1` 오류메시지 형식 (p. 16)
- `1.4.2` 오류메시지 유형 (p. 16)
- `2` KOSIS 공유서비스(OpenAPI) 주요기능 및 활용방법 (p. 17)
- `2.1` 통계목록 (p. 17)
- `2.1.1` 특징 (p. 17)
- `2.1.2` 서비스활용 (p. 18)
- `2.1.1.1` URL생성 (p. 18)
- `2.1.3` 활용방법 (p. 19)
- `2.1.1.1` JSON (p. 19)
- `2.1.1.1` SDMX(Category) (p. 26)
- `2.2` 통계자료 (p. 33)
- `2.2.1` 특징 (p. 33)
- `2.2.2` 서비스 활용 (p. 33)
- `2.2.2.1` URL 생성 (p. 33)
- `2.2.2.2` 자료등록 URL 생성 (p. 35)
- `2.2.2.2.1` 자료등록 (p. 35)
- `2.2.2.2.2` 등록된 자료 (p. 36)
- `2.2.2.2.3` URL생성 (p. 37)
- `2.2.3` 활용방법 (p. 39)
- `2.2.3.1` JSON (p. 39)
- `2.2.3.2` SDMX(DSD) (p. 54)
- `2.2.3.3` SDMX(Generic) (p. 70)
- `2.2.3.4` SDMX(StructureSpecific) (p. 86)
- `2.3` 대용량 통계자료 (p. 102)
- `2.3.1` 특징 (p. 102)
- `2.3.2` 서비스활용 (p. 102)
- `2.3.2.1` 자료등록 (p. 102)
- `2.3.2.2` 등록된자료 (p. 103)
- `2.3.2.3` URL 생성 (p. 104)
- `2.3.3` 활용방법 (p. 106)
- `2.3.3.1` SDMX(DSD) (p. 106)
- `2.3.3.2` SDMX(Generic) (p. 107)
- `2.3.3.3` SDMX(StructureSpecific) (p. 108)
- `2.3.3.4` XLS (p. 109)
- `2.4` 통계설명 (p. 110)
- `2.4.1` 특징 (p. 110)
- `2.4.2` 서비스활용 (p. 111)
- `2.4.2.1` URL생성 (p. 111)
- `2.4.3` 활용방법 (p. 112)
- `2.4.3.1` JSON (p. 112)
- `2.4.3.2` XML (p. 123)
- `2.5` 메타자료 (p. 137)
- `2.5.1` 특징 (p. 137)
- `2.5.2` 서비스활용 (p. 137)
- `2.5.2.1` URL생성 (p. 137)
- `2.5.3` 활용방법 (p. 138)
- `2.5.3.1` JSON(통계표 명칭) (p. 138)
- `2.5.3.2` JSON(기관 명칭) (p. 138)
- `2.5.3.3` JSON(수록정보) (p. 139)
- `2.5.3.4` JSON(분류/항목) (p. 139)
- `2.5.3.5` JSON(주석) (p. 140)
- `2.5.3.6` JSON(단위) (p. 140)
- `2.5.3.7` JSON(출처) (p. 141)
- `2.5.3.8` JSON(가중치) (p. 141)
- `2.5.3.9` JSON(자료갱신일) (p. 142)
- `2.5.3.10` XML(통계표 명칭) (p. 142)
- `2.5.3.11` XML(기관 명칭) (p. 143)
- `2.5.3.12` XML(수록정보) (p. 143)
- `2.5.3.13` XML(분류/항목) (p. 144)
- `2.5.3.14` XML(주석) (p. 144)
- `2.5.3.15` XML(단위) (p. 145)
- `2.5.3.16` XML(출처) (p. 145)
- `2.5.3.17` XML(가중치) (p. 146)
- `2.5.3.18` XML(자료갱신일) (p. 146)
- `2.6` KOSIS통합검색 (p. 147)
- `2.6.1` 특징 (p. 147)
- `2.6.2` 서비스활용 (p. 147)
- `2.6.2.1` URL생성 (p. 147)
- `2.6.3` 활용방법 (p. 148)
- `2.6.3.1` JSON (p. 148)
- `2.7` 통계주요지표 (p. 149)
- `2.7.1` 특징 (p. 149)
- `2.7.2` 서비스활용 (p. 149)
- `2.7.2.1` URL생성 (p. 149)
- `2.7.3` 활용방법 (p. 150)
- `2.7.3.1` JSON,XML(지표고유번호별 설명자료조회) (p. 150)
- `2.7.3.2` JSON,XML(지표명별 설명자료조회) (p. 151)
- `2.7.3.3` JSON,XML(목록별 지표조회) (p. 152)
- `2.7.3.4` JSON,XML(지표명별 목록조회) (p. 153)
- `2.7.3.5` JSON,XML(고유번호별 목록조회) (p. 154)
- `2.7.3.6` JSON,XML(고유번호별 지표 상세조회) (p. 155)
- `2.7.3.7` JSON,XML(수록주기별 목록조회) (p. 156)
- `2.7.3.8` JSON,XML(지표명별 상세조회) (p. 157)

<!-- page: 5 -->

## 1 KOSIS 공유서비스(OpenAPI) 개요

KOSIS 공유서비스는 외부(기관,개인)에서 국가통계포털(KOSIS)의 통계정보를 서비스 또는 컨텐츠 개발에
활용할 수 있도록 인터페이스(API)를 제공하는 서비스입니다. 제공되는 정보는 아래와 같습니다.

서비스 대상 제공 형태
1) 통계목록 : KOSIS에서 서비스되고 있는 통계목록에 대한 정보 및 관련 통계표 정보
- 국내통계 주제별, 국내통계 기관별, 광복이전통계(1908~1943), 대한민국통계연감, JSON, SDMX
작성중지통계, 지역통계(주제별), 지역통계(기관별), e-지방지표(주제별), 영문 KOSIS

2) 통계자료 : KOSIS에서 공개되어 서비스되고 있는 약 7만여개 통계표에 대한 수치
JSON, SDMX
데이터 및 메타정보(분류, 항목, 단위 등)
3) 대용량 통계자료 : 상기 2) 통계자료와 동일한 정보를 제공하나 대량의 자료를
XLS, SDMX
한번에 제공
4) 통계설명 : 통계조사에 대한 상세 설명자료
- 조사명, 통계종류, 계속여부, 법적근거, 조사목적, 조사주기, 조사체계, 공표범위, JSON, XML
공표주기, 연락처
＊ 통계자료와 대용량 통계자료는 국제통계 등 라이선스 제약에 해당되는 자료는 서비스 제외

KOSIS 공유서비스를 활용하려면 국가통계포털(KOSIS) 회원으로 가입되어야 합니다. 기존 국가통계포털에
회원으로 가입된 사용자는 그대로 사용하시면 됩니다.

인증키는 회원 당 1개 발급되며, 1개 인증키로 모든 서비스를 이용하실 수 있습니다.
활용신청을 하시면 모든 서비스를 이용하실 수 있습니다.
활용신청에 대한 승인은 신청 후 자동 승인되어 바로 이용하실 수 있습니다.

서비스 대상별로 이용절차는 다음과 같습니다.

<!-- page: 6 -->

### 1.1 제공 콘텐츠

1.
### 1.1 통계목록

- 개요
통계표의 목록구성 정보 제공을 위한 OpenAPI입니다. 통계목록 단위로 호출하고 서비스뷰(주제별,

기관별 등 9가지)별로 상위목록의 정보와 연결된 통계표명을 제공합니다. 활용신청을 하면 자동으로
인증키가 발급되며 URL을 생성하여 자료를 활용할 수 있습니다.

- 서비스 내용

<!-- page: 7 -->

1.
### 1.2 통계자료

- 개요
통계표의 수치자료 및 메타정보(수록정보, 출처, 단위 등) 제공을 위한OpenAPI입니다.

메타정보는 수치자료와 같이 호출할 수도 있습니다. 활용신청을 하면 자동으로 인증키가 발급되며
통계자료를 등록하여 활용하여야 합니다.

- 서비스 내용

< 시계열 자료 >

< 횡단면 자료 >

<!-- page: 8 -->

1.
### 1.3 대용량 통계자료

- 개요
통계표의 수치자료 및 메타정보 제공을 위한 OpenAPI로, 통계표 전체, 분류 전체(일부), 항목
전체(일부)를 선택적으로 요청합니다. 데이터량이 많은 특성 상 자료제공 형태가 SDMX 외 CSV가
추가되며, 활용신청을 하면 자동으로 인증키가 발급되며 대용량 통계자료를 등록하여 활용하여야

합니다.

- 서비스 내용

<!-- page: 9 -->

1.
### 1.4 통계설명

- 개요
통계조사에 대한 설명자료 제공을 위한 OpenAPI입니다. 통계표 또는 통계조사 단위로 호출하면

통계조사에 대한 설명자료 정보가 API로 제공됩니다.
활용신청을 하면 자동으로 인증키가 발급되며 URL을 생성하여 자료를 활용할 수 있습니다.

- 서비스 내용

<!-- page: 10 -->

1.
### 1.5 메타자료

- 개요
통계자료에 대한 메타자료 제공을 위한 OpenAPI입니다. 통계자료에 대한 통계표 명칭, 기관명칭,

수록정보, 분류/항목, 주석, 단위, 출처, 가중치, 자료갱신일에 대한 정보가 API로 제공됩니다.

- 서비스 내용

< 통계표 명칭 >

< 기관 명칭 >

< 수록정보 >

< 분류/항목 >

< 주석 >

< 단위 >

< 출처 >

<!-- page: 11 -->

1.
### 1.6 KOSIS통합검색

- 개요
통계표의 목록구성 정보 제공을 위한 OpenAPI입니다. 통계목록 단위로 호출하고 서비스뷰

(주제별, 기관별 등 13가지)별로 상위목록의 정보와 연결된 통계표명을 제공합니다.
활용신청을 하면 자동으로 인증키가 발급되며 URL을 생성하여 자료를 활용할 수 있습니다.

- 서비스 내용

<!-- page: 12 -->

1.
### 1.7 통계주요지표

- 개요
통계표의 목록구성 정보 제공을 위한 OpenAPI입니다. 통계목록 단위로 호출하고 서비스뷰(주제별,

기관별 등 13가지)별로 상위목록의 정보와 연결된 통계표명을 제공합니다.
활용신청을 하면 자동으로 인증키가 발급되며 URL을 생성하여 자료를 활용할 수 있습니다.

- 서비스 내용

< 지표고유번호별/지표명별 설명자료조회 >

< 지표명별 목록조회 >

< 고유번호별 목록조회 >

< 고유번호별 지표 상세조회 >

< 수록주기별 목록조회 >

< 지표명별 상세조회 >

<!-- page: 13 -->

### 1.2 회원가입

- OpenAPI를 활용하기 위해서는 KOSIS회원이어야 합니다. KOSIS 회원가입 방법 및 절차는 아래와
같습니다.

- 페이지 상단의 회원가입 버튼을 클릭하면 KOSIS 회원가입페이지로 이동하며 제공된 양식에 따라
회원가입을 진행 할 수 있습니다.

<!-- page: 14 -->

### 1.3 인증키 발급 및 서비스 신청

1.
### 3.1 활용신청

- 활용신청 양식을 활용용도와 사용목적 등을 작성한 뒤 ①등록버튼을 클릭합니다.
②의 [약관보기]를 클릭하면 통계정보 활용약관 팝업이 호출됩니다.

<!-- page: 15 -->

1.
### 3.2 신청현황

- 활용신청이 완료되면 신청현황 단계로 넘어가며, 기본정보에서는 사용자 인증키가 발급된 것을
확인이 가능하고, 서비스정보, 활용정보를 확인 할 수 있습니다. ①신청정보 수정을 누르면 신청
정보 수정 단계로 넘어갑니다.

<!-- page: 16 -->

### 1.4 에러메시지

- KOSIS OpenAPI 에러 메시지는 아래와 같습니다.

1.
### 4.1 오류메시지 형식

1.
### 4.2 오류메시지 유형

오류코드 오류메시지 조치방법

10 인증키 누락 인증키 확인

11 인증키 기간만료 인증키 기간 연장

20 필수요청변수 누락 필수요청변수 확인

21 잘못된 요청변수 요청변수 확인

30 조회결과 없음 조회조건 확인

31 조회결과 초과 호출건수 조정

40 호출가능건수 제한 관리자에게 문의

41 호출가능ROW수 제한 관리자에게 문의

42 사용자별 이용 제한 관리자에게 문의

50 서버오류 관리자에게 문의

<!-- page: 17 -->

## 2 OpenAPI 주요기능 및 활용방법

### 2.1 통계목록

- 통계표의 목록구성 정보 제공을 위한 OpenAPI입니다.

2.
### 1.1 특징

- 통계표 서비스 목록으로서 레벨 형태로 구성
- 자료 제공 형태: SDMX, JSON

<!-- page: 18 -->

2.
### 1.2 서비스 활용

2.
1.
### 2.1 URL생성

- 개발가이드 > 통계목록 > URL생성
목록구분, 목록조회, 결과유형을 입력한 뒤 ‘URL복사’, ‘결과값보기’ 중 원하는 서비스에 해당하
는 버튼을 누르면 결과값을 제공받을 수 있습니다.

<!-- page: 19 -->

2.
### 1.3 활용방법

2.
1.
### 3.1 JSON

- 호출 URL: `http://kosis.kr/openapi/statisticsList.do`
- 입력 변수

항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
서비스뷰 코드
· MT_ZTITLE : 주제별 통계

· MT_OTITLE : 기관별 통계
· MT_CHOSUN_TITLE : 광복이전통계(1908~1943)
· MT_HANKUK_TITLE : 대한민국통계연감
vwCd String 필수
· MT_STOP_TITLE : 작성중지통계
· MT_ATITLE01 : 지역통계 (주제별)
· MT_ATITLE02 : 지역통계 (기관별)

· MT_GTITLE01 : e-지방지표(주제별)
· MT_ETITLE : 영문KOSIS

parentListId String 시작목록 ID 필수
format String 결과 유형(json, sdmx) 필수

content String 헤더 유형(html, json) 선택

- 출력 변수

항목명(영문) 항목설명 형식
VW_CD 서비스뷰ID VARCHAR2(40)

VW_NM 서비스뷰명 VARCHAR2(300)

LIST_ID 목록ID VARCHAR2(40)

LIST_NM 목록명 VARCHAR2(300)
ORG_ID 기관코드 VARCHAR2(40)

TBL_ID 통계표ID VARCHAR2(40)

TBL_NM 통계표명 VARCHAR2(300)

STAT_ID 통계조사ID VARCHAR2(40)

SEND_DE 최종갱신일 VARCHAR2(8)
REC_TBL_SE 추천 통계표 여부 VARCHAR2(10)

<!-- page: 20 -->

- 예제 소스 결과

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 통계목록을 생성하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다


 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->

<!DOCTYPE html   PUBLIC  "-//W3C//DTD XHTML  1.0   Transitional//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">

<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link         type="text/css"     rel="stylesheet"    media="all"
href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.css" />

<link         type="text/css"     rel="stylesheet"    media="all"
href="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide01/css/openTmp.css" />

<script             type="text/javascript"      language="JavaScript"
src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide01/js/dojo.js" ></script>

<script             type="text/javascript"      language="JavaScript"
src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide01/js/json.js" ></script>
<script             type="text/javascript"      language="JavaScript"
src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide01/js/ajax.js"></script>
<script type="text/javascript" language="JavaScript">


var mapData;













// window onload 되었을때 실행 함수
dojo.addOnLoad ( function() {

// 통계목록 리스트를 조회하기위해 함수를 호출한다.

getSubList("MT_ZTITLE", 0, "");
});

/****************************************************
* 통계목록 리스트 조회 함수

* parameter : vwcd - 서비스뷰 코드 (통계목록구분)
* listLev - 목록 레벨
* parentId - 시작목록 Id
****************************************************/
function getSubList(vwcd, listLev, parentId) {


// ajax 통신을 위한 파라메터를 변수에 담는다.
var paraObj = {
// 임의의 jsp 페이지를 호출함으로써 cross domain 제약을 우회할 수 있다. (devGuidePop.jsp 소스는 소스 하단에
제공)
url              :              "http://[개발자           홈페이지

주소]/devGuidePop.jsp?method=getList&key=ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=&vwcd=MT_Z
TITLE&parentId=" + parentId + "&type=json",
sync : true,
load : function(resObj, a, b) { mapData = resObj; },
error : function ( resObj, e ) { alert(dojo.toJson(resObj)); }
}


// ajax 통신 호출 함수
sendPost( paraObj );

// 통계목록 리스트를 화면에 출력하기 위한 함수

makeNode( Number(listLev) + 1 );
}

/****************************************************
* 통계목록 리스트를 화면에 출력하기 위한 함수
* parameter : listLev - 목록 레벨

****************************************************/
function makeNode(listLev) {

var nodeInfo="";


nodeInfo = nodeInfo+"<ul>";













for(var cnt=0; cnt<mapData.length; cnt++) {
nodeInfo = nodeInfo + "<li>";
if ( mapData[cnt].TBL_ID != null ) {
nodeInfo = nodeInfo + "<img src='http://mgmk.kosis.kr/openapi_dev/devGuide/devGuide01/image/stats.gif'> <a

t   a   r   g    e   t   =    '   _   b   a    l   n   k    '
href=\"http://kosis.kr/start.jsp?orgId="+mapData[cnt].ORG_ID+"&tblId="+mapData[cnt].TBL_ID+"&vw_cd="+map
Data[cnt].VW_CD+"&up_id="+mapData[cnt].UP_ID+"\">"+mapData[cnt].TBL_NM+"</a>" ;
} else {
nodeInfo = nodeInfo + "<img src='http://mgmk.kosis.kr/openapi_dev/devGuide/devGuide01/image/folder.gif'> <a

href=\"javascript:getSubList('"+mapData[cnt].VW_CD+"', '" + listLev + "',
'"+mapData[cnt].LIST_ID+"');\">"+mapData[cnt].LIST_NM+"</a>" ;
}
nodeInfo = nodeInfo + "</li>";
}
nodeInfo = nodeInfo+"</ul>";


var r_node = document.getElementById("content"); //
var v_node = document.getElementById("depth"+listLev);
if( (typeof(v_node)!="undefined") && v_node!=null) {
v_node.innerHTML = nodeInfo;

}
else {
v_node = document.createElement("div");
v_node.setAttribute("id", "depth"+listLev);
v_node.className = "category0"+listLev;
v_node.innerHTML = nodeInfo;

r_node.appendChild(v_node);
}

var nodeCount = document.getElementsByTagName("div").length;


for( var cnt=(Number(listLev)+1); cnt< nodeCount; cnt++) {
if(document.getElementById("depth"+cnt)!=null)
r_node.removeChild(document.getElementById("depth"+cnt));
}
}
</script>

</head>
<body>
<div id="content" ></div>
</body>
</html>















// cross domain 제약을 우회하기 위한 jsp (devGuidePop.jsp)
<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core" %>


<c:set var="method" ><%out.println(request.getParameter("method") == null ? "" :
(request.getParameter("method"))); %></c:set>
<c:set var="key" ><%out.println(request.getParameter("key") == null ? "" : (request.getParameter("key")));
%></c:set>
<c:set var="vwcd" ><%out.println(request.getParameter("vwcd") == null ? "" : (request.getParameter("vwcd")));

%></c:set>
<c:set var="parentId"><%out.println(request.getParameter("parentId") == null ? "" :
(request.getParameter("parentId")));%></c:set>
<c:set var="type" ><%out.println(request.getParameter("type") == null ? "" : (request.getParameter("type")));
%></c:set>



<      c       :      i      m       p       o      r       t
url="http://mgmk.kosis.kr/openapi_dev/Expt/statisticsList.do?method=${method}&apiKey=${key}&vwCd=${vwcd}&
parentListId=${parentId}&format=${type}" charEncoding="utf-8"/>
```

<!-- page: 23 -->
### 예제 소스 (R)

```r
library(httr) # api,크롤링 등에 사용
library(rvest) # HTML처리
library(jsonlite) # JSON 읽어올때 사용

rm(list=ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')

baseurl <- 'https://kosis.kr/openapi/statisticsList.do'
v_vwCd ='MT_ZTITLE'  # 서비스뷰코드
v_parentListId ='A' # 시작목록ID

url_page <-
 GET(
  url = baseurl,
  query = list(
   method = 'getList',
   format = 'json',
   vwCd = v_vwCd,
   parentListId = v_parentListId,
   jsonVD = 'Y',
   apiKey = v_apiKey %>% I()
  )
 )













url_page %>% content(as = 'text', encoding = 'UTF-8') %>% fromJSON() -> json

df_lists <- data.frame(서비스뷰 = c(json$VW_CD))

# 통계표가 연결된 목록과 중간목록을 구분하여 처리
if (is.null(json$LIST_ID) == FALSE) {
 df_lists <- cbind(df_lists, 목록ID = c(json$LIST_ID))
 df_lists <- cbind(df_lists, 목록명 = c(json$LIST_NM))

} else {
 df_lists <- cbind(df_lists, 기관코드 = c(json$ORG_ID))
 df_lists <- cbind(df_lists, 통계표ID = c(json$TBL_ID))
 df_lists <- cbind(df_lists, 통계표명 = c(json$TBL_NM))
}

View(df_lists)
```

<!-- page: 24 -->
### 예제 소스 (Python)

```python
import json
from urllib.request import urlopen # python 3.x 버전에서 사용 (2.x 버전이라면 from urllib import urlopen)
from PyQt5 import QtWidgets
from PyQt5.QtWidgets import *
import functools as fc
import sys

#클릭한 목록에 대한 하위 목록 생성
class NewWindow(QtWidgets.QMainWindow):
  def __init__(self, parent=None):
    super(NewWindow, self).__init__(parent)
    centralWidget = QWidget()
    self.setCentralWidget(centralWidget)
    self.setGeometry(300, 300, 500, 500)

    Setting(self, List_Id)

#최상위 목록 생성
class MyWindow(QtWidgets.QMainWindow, QPushButton):
  def __init__(self):
    super(MyWindow, self).__init__()
    centralWidget = QWidget()
    self.setCentralWidget(centralWidget)
    self.setGeometry(200, 200, 500, 500)
    self.setStyleSheet("background-color: white")

    Setting(self, 'A')

#목록 셋팅 함수
def Setting(self, parentId):
  #url을 통해 json 데이터 가져오기
  with urlopen(
       "https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWRj












NjgxN2MzNDgwNmY=&vwCd=MT_ZTITLE&parentListId="+parentId+"&format=json&jsonVD=Y") as url:
    json_file = url.read()

  py_json = json.loads(json_file.decode('utf-8'))

  #하위 목록이 있다면 LinkButton, 하위 목록이 없다면 label로 생성
  for i, v in enumerate(py_json):
    if 'LIST_NM' in v:
       btn = QCommandLinkButton(v['LIST_NM'], self)
       btn.setStyleSheet("Text-align: left;"
                "border: none;"
                )
       btn.setGeometry(100, 50 * i, 500, 40)
       btn.clicked.connect(fc.partial(Action, self, v['LIST_ID']))
    else:
       lbl = QLabel(v['TBL_NM'], self)
       lbl.setGeometry(100, 50 * i, 500, 40)


def Action(self, check):
  global List_Id
  List_Id = check

  NewWindow(self).show()

if __name__ == "__main__":
  app = QtWidgets.QApplication(sys.argv)
  window = MyWindow()
  window.show()
  sys.exit(app.exec_())


































  2.1.3.2 SDMX(Category)
```

<!-- page: 26 -->
- 호출 URL: `http://kosis.kr/openapi/statisticsList.do`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
서비스뷰 코드

· MT_ZTITLE : 주제별 통계
· MT_OTITLE : 기관별 통계
· MT_CHOSUN_TITLE :

광복이전통계(1908~1943)
vwCd String · MT_HANKUK_TITLE : 대한민국통계연감 필수
· MT_STOP_TITLE : 작성중지통계

· MT_ATITLE01 : 지역통계 (주제별)
· MT_ATITLE02 : 지역통계 (기관별)
· MT_GTITLE01 : e-지방지표(주제별)

· MT_ETITLE : 영문KOSIS
parentListId String 시작목록 ID 필수

format String 결과 유형(json, sdmx) 필수
생략시
version String 결과값 구분 구버전으로

데이터 출력

- 출력 변수

항목명(영문) 항목설명

Id 서비스뷰ID
Name 서비스뷰명
Header Prepared 전송시간

Id 전송기관
Sender
Name 전송기관명
Id 상위목록 ID
Name 상위목록 명
Category Id 목록ID
Category Name 목록명칭
Category Category
Structures 기관코드_
Schemes Scheme Description Description
통계표ID
StatId StatId 통계조사ID
SendDe SendDe 최종갱신일
RecTblSe RecTblSe 추천 통계표 여부

<!-- page: 27 -->

- 예제 소스 결과

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 통계목록을 생성하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다


 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.

-->
<!DOCTYPE html   PUBLIC  "-//W3C//DTD XHTML  1.0    Transitional//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">

<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link         type="text/css"     rel="stylesheet"    media="all"

href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.css" />
<link         type="text/css"     rel="stylesheet"    media="all"
href="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide01/css/openTmp.css" />

<script              type="text/javascript"      language="JavaScript"
src="https://mgmk.kosis.kr/openapi_dev/ext/script/jquery-1.6.1.min.js"></script>

<script type="text/javascript" language="JavaScript">

var mapData;

// window onload 되었을때 실행 함수

$(document).ready(function(){













// 통계목록 리스트를 조회하기위해 함수를 호출한다.
getSubList("MT_ZTITLE", 0, "");
});

/****************************************************

* 통계목록 리스트 조회 함수
* parameter : vwcd - 서비스뷰 코드 (통계목록구분)
* listLev - 목록 레벨
* parentId - 시작목록 Id
****************************************************/

function getSubList(vwcd, listLev, parentId) {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
u                   r                   l                   :

"http://mgmk.kosis.kr/openapi_dev/Expt/statisticsList.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOW
RjNjgxN2MzNDgwNmY=&vwCd=MT_ZTITLE&parentListId=" + parentId + "&format=sdmx&version=v2_1",
async : true,
dataType: "xml",
success:function(object)

{

// ajax 통신이 성공하였을 때 통계목록 리스트를 화면에 출력하기 위한 함수
var data = object.documentElement.childNodes[1].childNodes[0].childNodes[0].childNodes;
var nodeInfo="";


nodeInfo = nodeInfo+"<ul>";

listLev = Number(listLev) + 1 ;

for(var cnt=1; cnt < data.length; cnt++) {

nodeInfo = nodeInfo + "<li>";

if ( data[cnt].childNodes.length== 2 ) {

nodeInfo = nodeInfo + "<img src='image/stats.gif'> <a target='_balnk' href=\"http://kosis.kr/start.jsp?orgId=" +
data[cnt].attributes[0].value.split("_")[0] + "&tblId=" + data[cnt].attributes[0].value.split("_")[1] + "_" +

data[cnt].attributes[0].value.split("_")[2] + "\">"+data[cnt].childNodes[0].childNodes[0].data+"</a>" ;
} else {
nodeInfo = nodeInfo + "<img src='image/folder.gif'> <a href=\"javascript:getSubList('MT_ZTITLE', '" + listLev +
"', '"+data[cnt].attributes[0].value+"');\">"+data[cnt].childNodes[0].childNodes[0].data+"</a>" ;
}

nodeInfo = nodeInfo + "</li>";












}
nodeInfo = nodeInfo+"</ul>";

var r_node = document.getElementById("content"); //
var v_node = document.getElementById("depth"+listLev);

if( (typeof(v_node)!="undefined") && v_node!=null) {
v_node.innerHTML = nodeInfo;
}
else {
v_node = document.createElement("div");

v_node.setAttribute("id", "depth"+listLev);
v_node.className = "category0"+listLev;
v_node.innerHTML = nodeInfo;
r_node.appendChild(v_node);
}


var nodeCount = document.getElementsByTagName("div").length;

for( var cnt=(Number(listLev)+1); cnt< nodeCount; cnt++) {
if(document.getElementById("depth"+cnt)!=null)
r_node.removeChild(document.getElementById("depth"+cnt));

}
},
error: function(xhr,status,error){
alert("error = " + error);
}
});

}
</script>
</head>
<body>
<div id="content" ></div>

</body>
</html>
```

<!-- page: 29 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)

library(XML)
library(stringr)

rm(list = ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )













# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')

baseurl <- 'https://kosis.kr/openapi/statisticsList.do'
v_vwCd = 'MT_ZTITLE'  # 서비스뷰코드

v_parentListId = 'A' # 시작목록ID

url_page <-
 GET(
  url = baseurl,

  query = list(
   method = 'getList',
   format = 'sdmx',
   vwCd = v_vwCd,
   parentListId = v_parentListId,
   apiKey = v_apiKey %>% I()

  )
 )

docParse <- xmlParse(url_page)


docList <-
 xmlToList(docParse)$Structures$CategorySchemes$CategoryScheme

df_lists <- data.frame()

for (i in 1:length(docList)) {

 v_len = length(docList[i]$Category)

 if (length(docList[i]$Category) == 2) {
  df_lists <-
   rbind(df_lists, cbind(

    목록ID = c(docList[i]$Category$.attrs),
    목록명 = c(docList[i]$Category$Name)
   ))
 } else if (v_len == 3) {
  tbl_info <- unlist(docList[2]$Category$.attrs)
  tbl_infos <- unlist(strsplit(tbl_info, '\\_'))

  v_org_id <- tbl_infos[1]
  v_tbl_id <-
   substr(
    tbl_info,
    str_length(v_org_id) + 2,

    str_length(tbl_info) - str_length(v_org_id) + 3












   )

  df_lists <-
   rbind(df_lists, cbind(
    기관코드 = v_org_id,

    통계표ID = v_tbl_id,
    통계표명 = c(docList[i]$Category$Name)
   ))
 }
}


View(df_lists)
```

<!-- page: 31 -->
### 예제 소스 (Python)

```python
from PyQt5 import QtWidgets
from PyQt5.QtWidgets import *

import functools as fc
import sys
import requests
from bs4 import BeautifulSoup

#클릭한 목록에 대한 하위 목록 생성

class NewWindow(QtWidgets.QMainWindow):
  def __init__(self, parent=None):
    super(NewWindow, self).__init__(parent)
    centralWidget = QWidget()
    self.setCentralWidget(centralWidget)

    self.setGeometry(300, 300, 500, 500)

    Setting(self, List_Id)

#최상위 목록 생성
class MyWindow(QtWidgets.QMainWindow, QPushButton):

  def __init__(self):
    super(MyWindow, self).__init__()
    centralWidget = QWidget()
    self.setCentralWidget(centralWidget)
    self.setGeometry(200, 200, 500, 500)

    self.setStyleSheet("background-color: white")

    Setting(self, 'A')

#목록 셋팅 함수
def Setting(self, parentId):













  open_url                                                  =
'https://kosis.kr/openapi/statisticsList.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDg
wNmY=&vwCd=MT_ZTITLE&parentListId='+parentId+'&format=sdmx&jsonVD=Y&version=v2_1'

  res = requests.get(open_url)

  soup = BeautifulSoup(res.content, 'html.parser')

  data = soup.find_all('structure:category')

  #window title 설정

  self.setWindowTitle(soup.find('structure:categoryscheme').find('common:name').text)

  #하위 목록이 있다면 LinkButton, 하위 목록이 없다면 label로 생성
  for i, item in enumerate(data):
    if item.find('common:description') == None:
      btn = QCommandLinkButton(item.find('common:name').text, self)

      btn.setStyleSheet("Text-align: left;"
                "border: none;"
                )
      btn.setGeometry(100, 50 * i, 500, 40)
      btn.clicked.connect(fc.partial(Action, self, item.get('id')))

    else:
      lbl = QLabel(item.find('common:name').text, self)
      lbl.setGeometry(100, 50 * i, 500, 40)

def Action(self, check):
  global List_Id

  List_Id = check

  NewWindow(self).show()



if __name__ == "__main__":
  app = QtWidgets.QApplication(sys.argv)
  window = MyWindow()
  window.show()
  sys.exit(app.exec_())
```

<!-- page: 33 -->
### 2.2 통계자료

- 통계표의 수치자료 및 메타정보(수록정보, 출처, 단위 등) 제공을 위한 OpenAPI입니다.

2.
### 2.1 특징

- 통계표의 수치자료를 시계열(단일계열, 여러시점) 또는 횡단면(다중계열, 단일시점)으로 제공
- 통계표의 수록정보, 분류/항목, 출처, 단위 등 메타정보 제공
- 자료 제공형태: SDMX (DSD, Generic, StructureSpecific), JSON, XML
- URL 선택 방식은 별도의 자료등록없이, 바로 필요한 통계표/항목/분류를 선택하고, URL에 테이블
ID/항목/분류 파라메타를 제공해, 이 값을 이용자가 동적으로 변경가능 함 으로서 이용할 자료를 미
리 등록하는 과정이 불필요한 방식입니다.(등록한 자료의 통계표 메타정보가 변경될 경우 확인 불가
능)
- URL 자료등록 방식은 생성내역의 통계표 및 URL이 저장되어 등록한 자료의 통계표 메타정보가
변경될 경우 이용자가 확인 가능하며 테이블/항목/분류 등 정보값을 이용자가 동적으로 변경할 수
없는 방식입니다.

2.
### 2.2 서비스 활용

2.
2.
### 2.1 URL 생성

- 개발가이드 > 통계자료 > URL생성
‘작성기관’, ‘통계조사명’, ‘통계표명’ 등 을 입력하여 사용하고자 하는 자료를 조회한 뒤 조회결과에
서 생성할 통계표 ①선택하면 하단에 ③URL생성 조건 설정이 출력됩니다.
②통계표조회 버튼을 클릭하면 해당 자료의 통계표를 볼 수 있습니다.
③URL생성 조건 설정에서 ’분류/항목선택’, 출력형태 설정, 조회기간 설정을 입력 후 ④URL보기 버
튼을 클릭하면 생성된 URL이 조회되고, ⑤URL복사 버튼을 누르면 생성된 URL이 클립보드에 복사
됩니다.
- URL길이를 줄이기 위해 항목/분류 파라메타에 간판 키워드 적용
- 항목과 분류별 전체선택시 ‘all’ -> 예) itmID = all, objL1 – all - 레벨로 구성된 분류의 경우
하위레벨 전체 선택시 ‘*’ -> 예) 행정구역별에서 서울(11)의 하위레벨
전체를 포함하고자 할 경우 objL1 = 11*
- 항목, 분류값 추가시 ‘+’ -> 예) 행정구역별에서 서울(11)과 부산(21)을 선택할 경우 objL1 =
11+ 21
✳ 시스템 부하를 줄이기 위해 통계자료 요청은 4만셀 이하로 제한

<!-- page: 34 -->

<!-- page: 35 -->

2.
2.
### 2.2 자료등록 URL 생성

2.
2.
2.
### 2.1 자료 등록

- 개발가이드 > 통계자료 > URL생성 > 자료등록
‘작성기관’, ‘통계조사명’, ‘통계표명’ 등 을 입력하여 사용하고자 하는 자료를 조회한 뒤 조회결
과에서 등록할 자료의 ①사용여부 항목을 선택하고 ②통계표 등록 버튼을 누른다.
③통계표조회 버튼을 클릭하면 해당 자료의 통계표를 볼 수 있습니다.

<!-- page: 36 -->

2.
2.
2.
### 2.2 등록된 자료

- 마이페이지 > 등록한 자료 > 통계자료 > 등록된 자료
자료등록의 통계표 등록을 마치면, 이용자가 등록한 자료들의 목록이 나타나며, 등록된 자료
중 URL생성을 원하는 자료의 ①URL생성 버튼을 누른다.
②통계표조회 버튼을 클릭하면 해당 자료의 통계표를 볼 수 있습니다.

- 마이페이지 > 등록한 자료 > 통계자료 > 등록된 자료 > 삭제
①버튼을 클릭한 후 하단에 조회되는 사용자 생성 URL 목록을 ②삭제할 수 있습니다.

<!-- page: 37 -->

2.
2.
2.
### 2.3 URL생성

- 마이페이지 > 등록한 자료 > 통계자료 > 등록된 자료 > 생성
URL생성 단계에서는 URL생성 조건 설정의 ‘활용 자료명’, ’분류/항목선택’을 입력 후 ①URL생
성 버튼을 누르면 URL생성 상세조건 화면으로 이동 후 URL이 하단에 생성됩니다. URL생성 상세
조건 화면에서 상세설정 후 ②URL보기, 결과값보기 버튼을 클릭하여 페이지 하단에서 결과를
확인 할 수 있고, ③URL복사 버튼을 누르면 생성된 URL이 클립보드에 복사됩니다.

<!-- page: 38 -->

<!-- page: 39 -->

2.
### 2.3 활용방법

2.
2.
### 3.1 JSON

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do`
- 입력 변수

l 자료등록 방법

항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수
userStatsId String 사용자 등록 통계표 필수

prdSe String 수록주기 필수
startPrdDe String 시작수록시점

시점기준
선택
endPrdDe String 종료수록시점
(시점기준 또는
newEstPrd
최신자료기준 택1)
String 최근수록시점 개수
최신자료 Cnt
기준
prdInterval String 수록시점 간격
format String 결과 유형(json, sdmx) 필수
content String 헤더 유형(html, json) 선택
l 통계표선택 방법
항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수

tblId String 통계표 ID 필수
objL1 String 분류1(첫번째 분류코드) 필수
objL2 ~ objL8 String 분류2(두번째 분류코드) ~ 분류8(여덟째 분류코드) 선택
itmId String 항목 필수

prdSe String 수록주기 필수

startPrdDe String 시작수록시점
시점기준
선택
endPrdDe String 종료수록시점
(시점기준 또는
최신자료기준
newEstPrd
String 최근수록시점 개수 택1)
Cnt
최신자료
기준
prdInterval String 수록시점 간격
format String 결과 유형(json, sdmx) 필수

<!-- page: 40 -->

- 출력 변수
항목명(영문) 항목설명 형식 비고

ORG_ID 기관코드 VARCHAR2(40)
TBL_ID 통계표ID VARCHAR2(40)
TBL_NM 통계표명 VARCHAR2(300)

C1 ~ C8 분류값 ID1 ~ 분류값 ID8 VARCHAR2(40)
C1_OBJ_NM ~ C8_OBJ_NM 분류명1 ~ 분류명8 VARCHAR2(3000)
C1_OBJ_NM_ENG ~ C8_OBJ_NM_ENG 분류 영문명1 ~ 분류 영문명8 VARCHAR2(3000) 2~8 분류값은

C1_NM ~ C8_NM 분류값 명1 ~ 분류값 명8 VARCHAR2(3000) 없을 경우 생략
C1_NM_ENG ~ C8_NM_ENG 분류값 영문명1 ~ 분류값 영문명8 VARCHAR2(3000)
ITM_ID 항목 ID VARCHAR2(40)

ITM_NM 항목명 VARCHAR2(3000)
ITM_NM_ENG 항목영문명 VARCHAR2(3000)
UNIT_ID 단위ID VARCHAR2(40)

UNIT_NM 단위명 VARCHAR2(1000)
UNIT_NM_ENG 단위영문명 VARCHAR2(1000)

PRD_SE 수록주기 VARCHAR2(20)
PRD_DE 수록시점 VARCHAR2(8)

DT 수치값 VARCHAR2(100)
LST_CHN_DE 최종수정일 VARCHAR2(8)
- 예제 소스 결과(막대차트)

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 막대차트를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한













   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml
1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<xml:namespace prefix="v"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
2/js/dojo.js" ></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
2/js/json.js" ></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
2/js/ajax.js"></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/ext/script/jquery-1.
6.1.min.js"></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
2/js/jquery.SimpleChart.js"></script>
<script type="text/javascript" language="JavaScript">
// window onload 되었을때 실행 함수
dojo.addOnLoad ( function() {

getList();
});

/****************************************************
* 통계자료 조회 함수
****************************************************/
function getList() {

// ajax 통신을 위한 파라메터를 변수에 담는다.
var paraObj = {
// 임의의 jsp 페이지를 호출함으로써 cross domain 제약을 우회할 수 있다. (devGuidePop.jsp 소스는 소스 하단에
제공)
url : "http://[개발자 홈페이지 주소]/devGuidePop.jsp?method=getList&key=ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgx
N2MzNDgwNmY=&format=json&userStatsId=openapisample/101/DT_1IN1502/2/1/20191106094026_1&prdSe=Y&n
ewEstPrdCnt=3",
sync : true,
load : function(mapData, a, b) {

// 차트에 보여주기위해 값을 담고있을 배열변수를 선언
var aData = new Array();













// 데이터를 배열변수에 적재
for(var i=0;i<mapData.length;i++) {

aData[i] = [mapData[i].DT.replace(/,/gi,''), mapData[i].PRD_DE, 'pink'];
}

// 차트를 그리기위한 옵션을 정의
var options = {'BarSize': '20px', 'BarSpace': '2px', 'type' : 'horizontal', 'Font': '2px'}

// 차트를 화면에 출력
$("#chart2").SimpleChart(aData,options);
},
error : function ( resObj, e ) {

alert(dojo.toJson(resObj));
}
}

// ajax 통신 호출 함수
sendPost( paraObj );
}
</script>
</head>
<body>
<div id="chart2" style="padding-top:30px;"></div>
</body>
</html>

// cross domain 제약을 우회하기 위한 jsp (devGuidePop.jsp)
<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core" %>

<c:set var="method" ><%out.println(request.getParameter("method") == null ? "" : (request.getParameter("metho
d"))); %></c:set>
<c:set var="key" ><%out.println(request.getParameter("key") == null ? "" : (request.getParameter("key"))); %></
c:set>
<c:set var="userStatsId"><%out.println(request.getParameter("userStatsId") == null ? "" : (request.getParameter("
userStatsId"))); %></c:set>
<c:set var="newEstPrdCnt"><%out.println(request.getParameter("newEstPrdCnt")== null ? "" : (request.getParame
ter("newEstPrdCnt"))); %></c:set>
<c:set var="prdSe" ><%out.println(request.getParameter("prdSe") == null ? "" : (request.getParameter("prdSe")));
%></c:set>
<c:set var="format" ><%out.println(request.getParameter("format") == null ? "" : (request.getParameter("format
"))); %></c:set>

<c:import url="http://mgmk.kosis.kr/openapi_dev/Expt/statisticsData.do?method=${method}&apiKey=${key}&form
at=${format}&userStatsId=${userStatsId}&prdSe=${prdSe}&newEstPrdCnt=${newEstPrdCnt}" charEncoding="utf-8
"/>
```

<!-- page: 42 -->
### 예제 소스 (R)

```r
library(httr)












library(rvest)
library(jsonlite)
library(ggplot2)

rm(list = ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsData.do' # 요청URL

url_page <-
 GET(
  url = baseurl,
  query = list(
   method = 'getList',
   format = 'json',
   jsonVD = 'Y',
   apiKey = v_apiKey %>% I(),
   userStatsId = 'openapisample/101/DT_1IN1502/2/1/20191106094026_1', # 시계열 조회 키캆
   prdSe = 'Y',
   newEstPrdCnt = 3, # 최근수록시점 개수
   prdInterval = 1 # 수록시점 간격
  )
 )
url_page %>% content(as = 'text', encoding = 'UTF-8') %>% fromJSON() -> json

df_lists <-
 data.frame(
  C1_NM = c(json$C1_NM),
  ITM_NM = c(json$ITM_NM),
  prd_de = c(json$PRD_DE),
  dt = c(json$DT)
 )

# 바차트
ggplot(df_lists, aes(x = prd_de, y = dt, fill = prd_de)) + xlab("시점") + ylab("") + ggtitle(json$TBL_NM[1]) + ge
om_bar(stat = "identity")
```

<!-- page: 43 -->
### 예제 소스 (Python)

```python
import json
from urllib.request import urlopen # python 3.x 버전에서 사용 (2.x 버전이라면 from urllib import urlopen)
import matplotlib.pyplot as plt

# 한글 폰트 사용을 위해서 세팅
from matplotlib import font_manager, rc
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc('font', family=font)














#url을 통해 json 데이터 가져오기
with urlopen("https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWR
jNjgxN2MzNDgwNmY=&format=json&jsonVD=Y&userStatsId=openapisample/101/DT_1IN1502/2/1/20191106094026
_1&prdSe=Y&newEstPrdCnt=3") as url:
  json_file = url.read()

py_json = json.loads(json_file.decode('utf-8'))


#변수 지정 및 데이터 저장
xAxis = []
yAxis = []
title = ''
for i, v in enumerate(py_json):
  xAxis.append(v['PRD_DE']) #x축에 들어갈 데이터
  yAxis.append(int(v['DT'])) #y축에 들어갈 데이터
  if i == 0 :
    title = v['TBL_NM'] #차트제목


#Bar차트 그리기
plt.bar(xAxis, yAxis)
plt.title(title)
#y축 수치를 안보이게 하는 코드. 필요에 따라 선택하여 사용
plt.gca().axes.yaxis.set_visible(False)

#Bar의 가운데에 text로 수치 표시
for i, v in enumerate(xAxis):
  plt.text(v, yAxis[i], yAxis[i],
       fontsize = 9,
       color='blue',
       horizontalalignment='center',
       verticalalignment='bottom')

plt.show()
```

<!-- page: 44 -->
- 예제 소스 결과(파이차트)

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 파이차트를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml
1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
2/js/dojo.js" ></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
2/js/json.js" ></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
2/js/ajax.js"></script>
<script type="text/javascript" language="JavaScript">
var mapData;

// window onload 되었을때 실행 함수
dojo.addOnLoad ( function() {

getList();
});

/****************************************************
* 통계자료 조회 함수
****************************************************/
function getList() {

// ajax 통신을 위한 파라메터를 변수에 담는다.
var paraObj = {
// 임의의 jsp 페이지를 호출함으로써 cross domain 제약을 우회할 수 있다. (devGuidePop.jsp 소스는 소스 하단에
제공)
url : "http://[개발자 홈페이지 주소]/devGuidePop.jsp?method=getList&key=ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgx
N2MzNDgwNmY=&format=json&userStatsId=openapisample/101/DT_1IN1502/2/1/20191106094026_1&prdSe=Y&n
ewEstPrdCnt=3",
sync : true,
load : function(resObj, a, b) {













// 차트에 보여주기위해 값을 담고있을 배열변수를 선언
mapData = resObj;
// 차트를 생성하기위한 함수 호출
chartShow();
},
error : function ( resObj, e ) {

alert(dojo.toJson(resObj));
}
}

// ajax 통신 호출 함수
sendPost( paraObj );
}

function chartShow(){

// 차트에 보여주기위해 값을 담고있을 배열변수를 선언
var data = new Array(mapData.length);

// 데이터를 배열변수에 적재
for(var i=0;i<mapData.length;i++) {
data[i] = mapData[i].DT;
}
// 파이차트를 출력하기위한 JavaScript Start
var canvas = document.getElementById("chartcanvas");

var context = canvas.getContext("2d");

var sw = canvas.width;
var sh = canvas.height;

var PADDING=50;

var colors = ["#7cfc00", "#0000ff", "#ff1493", "#66CDAA", "#ff00ff", "#FFD700"];

var center_X=sw/2; //원의 중심 x 좌표
var center_Y=sh/2; //원의 중심 y 좌표

var radius = Math.min(sw-(PADDING*2), sh-(PADDING*2)) / 2;
var angle = 0;
var total = 0;

for (var i in data) { total += Number(data[i]); } //데이터(data)의 총합 계산

for (var i = 0; i < data.length; i++) {

context.fillStyle = colors[i]; //생성되는 부분의 채울 색 설정
context.beginPath();
context.moveTo(center_X, center_Y); //원의 중심으로 이동
context.arc(center_X, center_Y, radius, angle, angle +(Math.PI*2*(data[i]/total)));
context.lineTo(center_X,center_Y);












context.fill();
angle += Math.PI*2*(data[i]/total);
}
// 파이차트를 출력하기위한 JavaScript End
}
</script>
</head>
<body>
<canvas id="chartcanvas" width="500" height="400"></canvas>
</body>
</html>


// cross domain 제약을 우회하기 위한 jsp (devGuidePop.jsp)
<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core" %>

<c:set var="method" ><%out.println(request.getParameter("method") == null ? "" : (request.getParameter("metho
d"))); %></c:set>
<c:set var="key" ><%out.println(request.getParameter("key") == null ? "" : (request.getParameter("key"))); %></
c:set>
<c:set var="userStatsId"><%out.println(request.getParameter("userStatsId") == null ? "" : (request.getParameter("
userStatsId"))); %></c:set>
<c:set var="newEstPrdCnt"><%out.println(request.getParameter("newEstPrdCnt")== null ? "" : (request.getParame
ter("newEstPrdCnt"))); %></c:set>
<c:set var="prdSe" ><%out.println(request.getParameter("prdSe") == null ? "" : (request.getParameter("prdSe")));
%></c:set>
<c:set var="format" ><%out.println(request.getParameter("format") == null ? "" : (request.getParameter("format
"))); %></c:set>
<c:import url="http://mgmk.kosis.kr/openapi_dev/Expt/statisticsData.do?method=${method}&apiKey=${key}&form
at=${format}&userStatsId=${userStatsId}&prdSe=${prdSe}&newEstPrdCnt=${newEstPrdCnt}" charEncoding="utf-8"
/>
```

<!-- page: 47 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)
library(jsonlite)
library(ggplot2)

rm(list = ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsData.do' # 요청URL

url_page <-
 GET(
  url = baseurl,
  query = list(
   method = 'getList',












   format = 'json',
   jsonVD = 'Y',
   apiKey = v_apiKey %>% I(),
   userStatsId = 'openapisample/101/DT_1IN1502/2/1/20191106094026_1', # 시계열 조회 키캆
   prdSe = 'Y',
   newEstPrdCnt = 3, # 최근수록시점 개수
   prdInterval = 1 # 수록시점 간격
  )
 )

url_page %>% content(as = 'text', encoding = 'UTF-8') %>% fromJSON() -> json

df_lists <-
 data.frame(
  C1_NM = c(json$C1_NM),
  ITM_NM = c(json$ITM_NM),
  prd_de = c(json$PRD_DE),
  dt = c(json$DT)
 )


# 파이차트 비율 라벨 값
pct <-
 round(as.numeric(df_lists$dt) / sum(as.numeric(df_lists$dt)) * 100, 1)
df_lists <- data.frame(df_lists, pct = pct)

# 파이차트
ggplot(df_lists, aes(
 x = factor(1),
 y = '',
 fill = factor(prd_de)
)) +
 geom_bar(stat = 'identity') +
 theme_void() +
 ggtitle(json$TBL_NM[1]) +
 coord_polar('y', start = 0) +
 geom_text(aes(label = paste0(round(pct, 1), '%')),
       position = position_stack(vjust = 0.5))
```

<!-- page: 48 -->
### 예제 소스 (Python)

```python
import json
from urllib.request import urlopen
import matplotlib.pyplot as plt

# 한글 폰트 사용을 위해서 세팅
from matplotlib import font_manager, rc
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc('font', family=font)

#url을 통해 json 데이터 가져오기












with urlopen("https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWR
jNjgxN2MzNDgwNmY=&format=json&jsonVD=Y&userStatsId=openapisample/101/DT_1IN1502/2/1/20191106094026
_1&prdSe=Y&newEstPrdCnt=3") as url:
  json_file = url.read()

py_json = json.loads(json_file.decode('utf-8'))

#변수 지정 및 데이터 저장
labels = []
ratio = []
title = ''

for i, v in enumerate(py_json):
  labels.append(v['PRD_DE']) #년도 데이터
  ratio.append(v['DT']) #값/비율 데이터
  if i == 0 :
    title = v['TBL_NM'] #차트제목

#Pie차트 그리기
plt.pie(ratio, labels=labels, autopct='%.1f%%')
plt.title(title)
plt.show()
```

<!-- page: 49 -->
- 예제 소스 결과(표차트)

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 통계표를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml












1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
1/js/dojo.js" ></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
1/js/json.js" ></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
1/js/ajax.js"></script>
<script type="text/javascript" language="JavaScript">

// window onload 되었을때 실행 함수
dojo.addOnLoad ( function() {

getList();
});
/****************************************************
* 통계자료 조회 함수
****************************************************/
function getList(vwcd, listLev, parentId) {

// ajax 통신을 위한 파라메터를 변수에 담는다. (통계자료)
var paraObj = {
// 임의의 jsp 페이지를 호출함으로써 cross domain 제약을 우회할 수 있다. (devGuidePop.jsp 소스는 소스 하단에
제공)
url : "http:[개발자 홈페이지 주소]/devGuidePop.jsp?method=getList&key=ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN
2MzNDgwNmY=&format=json&userStatsId=openapisample/101/DT_1IN1502/2/1/20191106094026_1&prdSe=Y&ne
wEstPrdCnt=3",
sync : true,
load : function(mapData, a, b) {

var strTable = "";
// 조회된 결과를 이용하여 통계표 작성
strTable += "<h5>" + mapData[0].TBL_NM + "</h5>";
strTable += "<p style='position:absolute; top:32px; left:450px;'>단위 : " + mapData[0].UNIT_NM + "</p>";
strTable += "<table cellpadding='0' cellspacing='0' class='TB02' summary='' style='margin-top:15px;width:500p
x;'>";
strTable += "<thead>";
strTable += "<tr>";
strTable += "<th class='fst al_C' scope='col'>시점</th>";
strTable += "<th scope='col'>" + mapData[0].ITM_NM + "(" + mapData[0].C1_NM + ")" + "</th>";
strTable += "</tr>";
strTable += "</thead>";
strTable += "<tbody>";













for(var i=0;i<mapData.length;i++) {
strTable += "<tr>";
strTable += "<td class='al_C'>" + mapData[i].PRD_DE + "</td>";
strTable += "<td class='al_C'>" + mapData[i].DT.replace(/,/gi,'') + "</td>";
strTable += "</tr>";
}
strTable += "</tbody>";
strTable += "</table>";

document.getElementById("content").innerHTML = strTable;
},
error : function ( resObj, e ) {

alert(dojo.toJson(resObj));
}
}
// ajax 통신 호출 함수
sendPost( paraObj );

// ajax 통신을 위한 파라메터를 변수에 담는다. (출처정보)
var paraObj = {
// 임의의 jsp 페이지를 호출함으로써 cross domain 제약을 우회할 수 있다.
url : "http://mgmk.kosis.kr/openapi_dev/devGuidePop.jsp?method=getMeta&key=ZjZjOTI3MjRjNmU1YzdhZTMwOW
RjNjgxN2MzNDgwNmY=&type=SOURCE&format=json&orgId=101&tblId=DT_1B01003",
sync : true,
load : function(mapData, a, b) {
var strTable = "";

// 조회된 결과를 이용하여 출처 작성
strTable += "<p style='position:absolute; top:250px; '>출처 : " + mapData[0].JOSA_NM + "</p>";

document.getElementById("content").innerHTML += strTable;
},
error : function ( resObj, e ) {

alert(dojo.toJson(resObj));
}
}
// ajax 통신 호출 함수
sendPost( paraObj );
}
</script>
</head>
<body>
<div id="content" style="padding-top:30px;"></div>
</body>
</html>


<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core" %>













<c:set var="method" ><%out.println(request.getParameter("method") == null ? "" : (request.getParameter("metho
d"))); %></c:set>
<c:set var="key" ><%out.println(request.getParameter("key") == null ? "" : (request.getParameter("key"))); %></
c:set>
<c:set var="userStatsId"><%out.println(request.getParameter("userStatsId") == null ? "" : (request.getParameter("
userStatsId"))); %></c:set>
<c:set var="newEstPrdCnt"><%out.println(request.getParameter("newEstPrdCnt")== null ? "" : (request.getParame
ter("newEstPrdCnt"))); %></c:set>
<c:set var="prdSe" ><%out.println(request.getParameter("prdSe") == null ? "" : (request.getParameter("prdSe")));
%></c:set>
<c:set var="format" ><%out.println(request.getParameter("format") == null ? "" : (request.getParameter("format
"))); %></c:set>
<c:set var="type" ><%out.println(request.getParameter("type") == null ? "" : (request.getParameter("type"))); %>
</c:set>
<c:set var="orgId" ><%out.println(request.getParameter("orgId") == null ? "" : (request.getParameter("orgId")));
%></c:set>
<c:set var="tblId" ><%out.println(request.getParameter("tblId") == null ? "" : (request.getParameter("tblId"))); %>
</c:set>

<c:import url="http://mgmk.kosis.kr/openapi_dev/Expt/statisticsData.do?method=${method}&apiKey=${key}&form
at=${format}&userStatsId=${userStatsId}&prdSe=${prdSe}&newEstPrdCnt=${newEstPrdCnt}&tblId=${tblId}&orgId=
${orgId}&type=${type}" charEncoding="utf-8"/>
```

<!-- page: 52 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)
library(jsonlite)
library(dplyr)

rm(list = ls()) # 모든변수 초기화
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsData.do' # 요청URL


url_page <-
 GET(
  url = baseurl,
  query = list(
   method = 'getList',
   format = 'json',
   jsonVD = 'Y',
   apiKey = v_apiKey %>% I(),
   userStatsId = 'openapisample/101/DT_1IN1502/2/1/20191106094026_1',
   # 시계열 조회 키캆
   prdSe = 'Y',
   newEstPrdCnt = 3 # 최근수록시점 개수
  )
 )

url_page %>% content(as = 'text', encoding = 'UTF-8') %>% fromJSON() -> json













df_lists <- data.frame()
df_lists <- cbind(json$PRD_DE)
df_lists <- cbind(df_lists, json$DT)

# 사용자가 선택한 통계 자료의 분류 갯수에 따라 변경
# 샘플소스의 key는 1개분류, 1개 항목 지정됨

colnames(df_lists) <-
 c("시점", paste(json$ITM_NM[1], "(", json$C1_NM[1], ")" , sep = ""))
View(df_lists)
```

<!-- page: 53 -->
### 예제 소스 (Python)

```python
 import json
 from urllib.request import urlopen # python 3.x 버전에서 사용 (2.x 버전이라면 from urllib import urlopen)
 import matplotlib.pyplot as plt


 # 한글 폰트 사용을 위해서 세팅
 from matplotlib import font_manager, rc
 font_path = "C:/Windows/Fonts/malgun.ttf"
 font = font_manager.FontProperties(fname=font_path).get_name()
 rc('font', family=font)


 #url을 통해 json 데이터 가져오기
 with urlopen("https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWR
 jNjgxN2MzNDgwNmY=&format=json&jsonVD=Y&userStatsId=openapisample/101/DT_1IN1502/2/1/20191106094026
 _1&prdSe=Y&newEstPrdCnt=3") as url:
   json_file = url.read()

 py_json = json.loads(json_file.decode('utf-8'))


 #변수 지정 및 데이터 저장
 data = []

 for i, v in enumerate(py_json):
   value = []
   value.append(v['PRD_DE'])
   value.append(v['DT'])

   data.append(value)

 #Table 만들기
 fig, ax = plt.subplots(1,1)
 column_labels=["시점", "총인구(전국)"]
 ax.axis('tight')
 ax.axis('off')
 ax.table(cellText=data,colLabels=column_labels,colColours =["yellow"] * 2, loc="center", cellLoc='center')
 plt.show()













2.2.3.2 SDMX(DSD)
```

<!-- page: 54 -->
- 호출 URL: `http://kosis.kr/openapi/statisticsData.do`
- 입력 변수
l 자료등록 방법
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
userStatsId String 사용자 등록 통계표 필수
type String SDMX의 유형(DSD, Generic, StructureSpecific) 필수

format String 결과 유형(json, sdmx) 필수
생략시
version String 결과값 구분 구버전으로
데이터 출력

l 통계표선택 방법
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수
tblId String 통계표 ID 필수

objL2 ~ objL8 String 분류2(두번째 분류코드) ~ 분류8(여덟째 분류코드) 선택
itmId String 항목 필수
type String SDMX의 유형(DSD, Generic, StructureSpecific) 필수
format String 결과 유형(json, sdmx) 필수
생략시

version String 결과값 구분 구버전으로
데이터 출력

- 출력 변수

항목명(영문) 항목설명
Id 기관코드_통계표ID

Name 통계표명
Prepared 전송시간

Id 전송기관
Header
Name 전송기관명
Sender
Department 담당부서
Contact
Telephone 담당부서 연락처
Source 출처
Id 코드리스트ID
Name 코드리스트명
Codelist Codelist
Description 코드리스트영문명
Code Id 코드ID

<!-- page: 55 -->

Name 코드명

Id 컨셉스키마ID
Name 컨셉스키마명

Description 컨셉스키마영문명
Concepts ConceptsScheme
Id 컨셉ID
Concept Name 컨셉명
Description 컨셉영문명
Id 통계표ID

Name 통계표명
DataStructures DataStructure
Id 디멘젼Id
DataStructureComponents Dimension
conceptldentity Id 컨셉객체Id

- 예제 소스 결과(막대차트)

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 막대차트를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml
1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">












<head>
<xml:namespace prefix="v"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/ext/script/jquery-1.
6.1.min.js"></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
2/js/jquery.SimpleChart.js"></script>
<script type="text/javascript" language="JavaScript">

// window onload 되었을때 실행 함수
$(document).ready(function(){
getSubList();
});

/****************************************************
* 통계자료 조회 함수
****************************************************/
function getSubList() {
// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/Expt/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTM
wOWRjNjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2
/1/20191106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1",
data: "",
async : true,
dataType: "xml",
success:function(object)
{

var data = object.documentElement.childNodes[1].childNodes[0].childNodes;

// 차트에 보여주기위해 값을 담고있을 배열변수를 선언
var aData = new Array();

// 데이터를 배열변수에 적재
for(var i=0; i < data.length; i++) {

aData[i] = [data[i].attributes[0].value.replace(/,/gi,''), data[i].attributes[1].value, 'pink'];
}

// 차트를 그리기위한 옵션을 정의
var options = {'BarSize': '20px', 'BarSpace': '2px', 'type' : 'horizontal', 'Font': '2px'}

// 차트를 화면에 출력
$("#chart2").SimpleChart(aData,options);
},












error: function(xhr,status,error){
alert("error = " + error);
}
});
}

</script>
</head>
<body>
<div id="chart2" style="padding-top:30px;"></div>
</body>
</html>
```

<!-- page: 57 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)
library(XML)


rm(list = ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsData.do' # 요청URL

res <-
 GET(
  url = baseurl,
  query = list(
   method = 'getList',
   format = 'sdmx',
   apiKey = v_apiKey %>% I(),
   userStatsId = 'openapisample/101/DT_1IN1502/2/1/20191106094026_1',
   # 시계열 조회 키캆
   jsonVD = 'Y',
   type = 'StructureSpecific',
   prdSe = 'Y',
   newEstPrdCnt = 3,
   # 최근수록시점 개수
   prdInterval = 1,
   # 수록시점 간격
   version = 'v2_1'
  )
 )


docParse <- xmlParse(res)

tbl_title <- xmlToList(docParse)$Header$Name # 통계표명
docList <- xmlToList(docParse)$DataSet$Series













df_lists <- data.frame()

for (i in 1:length(docList)) {
 if (length(docList[i]$Obs) == 2) {
  df_lists <-
   rbind(df_lists, cbind(
    prd_de = paste(docList[i]$Obs[2]),
    dt = paste(docList[i]$Obs[1])
   ))
 }
}

# 바차트
ggplot(df_lists, aes(x = prd_de, y = dt, fill = prd_de)) + xlab("시점") + ylab("") + ggtitle(tbl_title) + geom_bar(st
at = "identity")
```

<!-- page: 58 -->
### 예제 소스 (Python)

```python
import matplotlib.pyplot as plt
import requests
from bs4 import BeautifulSoup

# 한글 폰트 사용을 위해서 세팅
from matplotlib import font_manager, rc
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc('font', family=font)

#url을 통해 sdmx 데이터 가져오기
open_url = 'https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWRj
NjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2/1/201
91106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1'
res = requests.get(open_url)
soup = BeautifulSoup(res.content, 'html.parser')


#변수 지정 및 데이터 저장
xAxis = []
yAxis = []
title = soup.find('common:name').text #차트제목

dataList = soup.find_all('obs')

for item in dataList:
  xAxis.append(item.get('time_period')) #년도 데이터
  yAxis.append(int(item.get('obs_value'))) #값/비율 데이터

#Bar차트 그리기
plt.bar(xAxis, yAxis)













plt.title(title)



#y축 수치를 안보이게 하는 코드. 필요에 따라 선택하여 사용
plt.gca().axes.yaxis.set_visible(False)

#Bar의 가운데에 text로 수치 표시
for i, v in enumerate(xAxis):
  plt.text(v, yAxis[i], yAxis[i],
       fontsize = 9,
       color='blue',
       horizontalalignment='center',
       verticalalignment='bottom')

plt.show()
```

<!-- page: 59 -->
- 예제 소스 결과(파이차트)

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 파이차트를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml
1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<xml:namespace prefix="v"/>












<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/ext/script/jquery-1.
6.1.min.js"></script>
<script type="text/javascript" language="JavaScript">

// window onload 되었을때 실행 함수
$(document).ready(function(){
getSubList();
});

/****************************************************
* 통계자료 조회 함수
****************************************************/
function getSubList() {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/Expt/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTM
wOWRjNjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2
/1/20191106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1",
data: "",
async : true,
dataType: "xml",
success:function(object)
{
var mapdata = object.documentElement.childNodes[1].childNodes[0].childNodes;

// 차트에 보여주기위해 값을 담고있을 배열변수를 선언
var data = new Array(mapdata.length);

// 데이터를 배열변수에 적재
for(var i=0;i<mapdata.length;i++) {
data[i] = mapdata[i].attributes[0].value;
}

// 파이차트를 출력하기위한 JavaScript Start
var canvas = document.getElementById("chartcanvas");
var context = canvas.getContext("2d");
var sw = canvas.width;
var sh = canvas.height;
var PADDING=100;

//Browser별 색상 lawngreen, blue, deeppink, aquamarine3, magenta, gold
var colors = ["#7cfc00", "#0000ff", "#ff1493", "#66CDAA", "#ff00ff", "#FFD700"];

var center_X=sw/2; //원의 중심 x 좌표












var center_Y=sh/2; //원의 중심 y 좌표
// 두 계산값 중 작은 값은 값을 원의 반지름으로 설정
var radius = Math.min(sw-(PADDING*2), sh-(PADDING*2)) / 2;
var angle = 0;
var total = 0;

for (var i in data) { total += Number(data[i]); } //데이터(data)의 총합 계산

for (var i = 0; i < data.length; i++) {

context.fillStyle = colors[i]; //생성되는 부분의 채울 색 설정
context.beginPath();
context.moveTo(center_X, center_Y); //원의 중심으로 이동
context.arc(center_X, center_Y, radius, angle, angle +(Math.PI*2*(data[i]/total)));
context.lineTo(center_X,center_Y);
context.fill();
angle += Math.PI*2*(data[i]/total);
}
// 파이차트를 출력하기위한 JavaScript End
},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}
</script>
</head>
<body>
<canvas id="chartcanvas" width="500" height="400"></canvas>
</html>
```

<!-- page: 61 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)
library(XML)
library(ggplot2)

rm(list = ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsData.do' # 요청URL

res <-
 GET(
  url = baseurl,
  query = list(
   method = 'getList',
   format = 'sdmx',
   apiKey = v_apiKey %>% I(),
   userStatsId = 'openapisample/101/DT_1IN1502/2/1/20191106094026_1',












   # 시계열 조회 키캆
   jsonVD = 'Y',
   type = 'StructureSpecific',
   prdSe = 'Y',
   newEstPrdCnt = 3,
   # 최근수록시점 개수
   prdInterval = 1,
   # 수록시점 간격
   version = 'v2_1'
  )
 )

docParse <- xmlParse(res)

v_tbl_nm <- xmlToList(docParse)$Header$Name # 통계표명
docList <- xmlToList(docParse)$DataSet$Series

df_lists <- data.frame()

for (i in 1:length(docList)) {
 if (length(docList[i]$Obs) == 2) {
  df_lists <-
   rbind(df_lists, cbind(
    prd_de = paste(docList[i]$Obs[2]),
    dt = paste(docList[i]$Obs[1])
   ))
 }
}
# 파이차트 비율 라벨 값
pct <-
 round(as.numeric(df_lists$dt) / sum(as.numeric(df_lists$dt)) * 100, 1)
df_lists <- data.frame(df_lists, pct = pct)


# 파이차트
ggplot(df_lists, aes(
 x = factor(1),
 y = '',
 fill = factor(prd_de)
)) +
 geom_bar(stat = 'identity') +
 theme_void() +
 ggtitle(v_tbl_nm) +
 coord_polar('y', start = 0) +
 geom_text(aes(label = paste0(round(pct, 1), '%')),
       position = position_stack(vjust = 0.5))
```

<!-- page: 62 -->
### 예제 소스 (Python)

```python
import matplotlib.pyplot as plt
import requests
from bs4 import BeautifulSoup













# 한글 폰트 사용을 위해서 세팅
from matplotlib import font_manager, rc
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc('font', family=font)

#url을 통해 sdmx 데이터 가져오기
open_url = 'https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWRj
NjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2/1/201
91106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1'

res = requests.get(open_url)
soup = BeautifulSoup(res.content, 'html.parser')

#변수 지정 및 데이터 저장
labels = []
ratio = []
title = soup.find('common:name').text #차트제목

dataList = soup.find_all('obs')

for item in dataList:
  labels.append(item.get('time_period')) #년도 데이터
  ratio.append(item.get('obs_value')) #값/비율 데이터
#Pie차트 그리기
plt.pie(ratio, labels=labels, autopct='%.1f%%')
plt.title(title)
plt.show()
```

<!-- page: 63 -->
- 예제 소스 결과(표차트)

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 통계표를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한













   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml
1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<xml:namespace prefix="v"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/ext/script/jquery-1.
6.1.min.js"></script>
<script type="text/javascript" language="JavaScript">

// window onload 되었을때 실행 함수
$(document).ready(function(){
getSubList();
});
var strUnitId, strItmId, strC1;

/****************************************************
* 통계자료 조회 함수
****************************************************/
function getSubList() {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/Expt/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTM
wOWRjNjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2
/1/20191106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1",
data: "",
sync : true,
dataType: "xml",
success:function(object)
{

var mapdata = object.documentElement.childNodes[1].childNodes[0].childNodes;

// 항목, 분류, 단위의 명칭을 조회하기위해 각각의 코드를 변수에 저장
for(var i=0;i<object.documentElement.childNodes[1].childNodes[0].attributes.length;i++) {

if (object.documentElement.childNodes[1].childNodes[0].attributes[i].nodeName == "ITEM") {

strItmId = object.documentElement.childNodes[1].childNodes[0].attributes[i].value;












} else if (object.documentElement.childNodes[1].childNodes[0].attributes[i].nodeName == "C_HJG") {

strC1 = object.documentElement.childNodes[1].childNodes[0].attributes[i].value;
} else if (object.documentElement.childNodes[1].childNodes[0].attributes[i].nodeName == "UNIT") {

strUnitId = object.documentElement.childNodes[1].childNodes[0].attributes[i].value;
}
}
var strTable = "";

// 조회된 결과를 이용하여 통계표 작성
strTable += "<p style='position:absolute; top:32px; left:450px;' id='unitId'></p>";
strTable += "<table cellpadding='0' cellspacing='0' class='TB02' summary='' style='margin-top:15px;width:500p
x;'>";
strTable += "<thead>";
strTable += "<tr id = 'theadId'>";

strTable += "</tr>";
strTable += "</thead>";
strTable += "<tbody>";

for(var i=0;i<mapdata.length;i++) {
strTable += "<tr>";
strTable += "<td class='al_C'>" + mapdata[i].attributes[1].value + "</td>";
strTable += "<td class='al_C'>" + mapdata[i].attributes[0].value + "</td>";
strTable += "</tr>";
}
strTable += "</tbody>";
strTable += "</table>";
document.getElementById("content").innerHTML = strTable;

fnGetTitle ();
fnGetUnit ();
fnGetItm ();
},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}

/****************************************************
* 통계표 명칭 조회
****************************************************/
function fnGetTitle () {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/statisticsData.do?method=getMeta&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=xml&type=TBL&orgId=101&tblId=DT_1B01003",
data: "",












sync : true,
dataType: "xml",
success:function(object)
{

var mapdata = object.documentElement.childNodes[1].childNodes[0].childNodes;

// 조회된 결과를 이용하여 통계표 명칭 작성
var strTable = document.getElementById("content").innerHTML;
document.getElementById("content").innerHTML = "<h5>" + object.documentElement.childNodes[1].childNodes
[0].childNodes[0].data + "</h5>" + strTable;

},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}

/****************************************************
* 항목 명칭 조회
****************************************************/
function fnGetItm () {
// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/statisticsData.do?method=getMeta&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=xml&type=ITM&orgId=101&tblId=DT_1B01003&objId=ITEM&itmId=" + strItmId,
data: "",
sync : true,
dataType: "xml",
success:function(object)
{
// 분류 명칭 조회
fnGetC1(object.documentElement.childNodes[1].childNodes[0].childNodes[4].childNodes[0].data);
},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}

/****************************************************
* 분류 명칭 조회
****************************************************/
function fnGetC1(itmNm) {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/statisticsData.do?method=getMeta&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=xml&type=ITM&orgId=101&tblId=DT_1B01003&objId=HJG&itmId=" + strC1,












data: "",
sync : true,
dataType: "xml",
success:function(object)
{
var strTable = "";

// 조회된 결과를 이용하여 항목, 분류 작성
strTable += "<th class='fst al_C' scope='col'>시점</th>";
strTable += "<th scope='col'>" + itmNm + "(" + object.documentElement.childNodes[1].childNodes[0].childNod
es[4].childNodes[0].data + ")" + "</th>";

document.getElementById("theadId").innerHTML = strTable;

},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}

/****************************************************
* 단위 명칭 조회
****************************************************/
function fnGetUnit () {
// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/statisticsData.do?method=getMeta&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=xml&type=UNIT&unitId=" + strUnitId,
data: "",
sync : true,
dataType: "xml",
success:function(object)
{

// 조회된 결과를 이용하여 단위 명칭 작성
var mapdata = object.documentElement.childNodes[1].childNodes[0].childNodes;

document.getElementById("unitId").innerHTML = "단위 : " + object.documentElement.childNodes[1].childNodes
[0].childNodes[0].data;

},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}

</script>
</head>
<body>












<div id="content" style="padding-top:30px;"></div>
</html>
```

<!-- page: 68 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)
library(XML)

rm(list = ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsData.do' # 요청URL

res <-
 GET(
  url = baseurl,
  query = list(
   method = 'getList',
   format = 'sdmx',
   apiKey = v_apiKey %>% I(),
   userStatsId = 'openapisample/101/DT_1IN1502/2/1/20191106094026_1', # 시계열 조회 키캆
   jsonVD = 'Y',
   type = 'StructureSpecific',
   prdSe = 'Y',
   newEstPrdCnt = 3, # 최근수록시점 개수
   prdInterval = 1, # 수록시점 간격
   version = 'v2_1'
  )
 )

docParse <- xmlParse(res)

docList <- xmlToList(docParse)$DataSet$Series

df_lists <- data.frame()

for (i in 1:length(docList)) {
 if (length(docList[i]$Obs) == 2) {
  df_lists <-
   rbind(df_lists, cbind(paste(docList[i]$Obs[2]), paste(docList[i]$Obs[1])))
 }
}

colnames(df_lists) <- c("시점", "수치")

View(df_lists)
```

<!-- page: 68 -->
### 예제 소스 (Python)

```python
import matplotlib.pyplot as plt
import requests












from bs4 import BeautifulSoup


# 한글 폰트 사용을 위해서 세팅
from matplotlib import font_manager, rc
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc('font', family=font)



#url을 통해 sdmx 데이터 가져오기
open_url = 'https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWRj
NjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2/1/201
91106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1'

res = requests.get(open_url)
soup = BeautifulSoup(res.content, 'html.parser')

dataList = soup.find_all('obs')


#변수 지정 및 데이터 저장
data = []
for item in dataList:
  value = []
  value.append(item.get('time_period')) #년도 데이터
  value.append(item.get('obs_value')) #값 데이터

  data.append(value)

#Table 만들기
fig, ax = plt.subplots(1,1)
column_labels=["시점", "총인구(전국)"]
ax.axis('tight')
ax.axis('off')
ax.table(cellText=data,colLabels=column_labels,colColours =["yellow"] * 2, loc="center", cellLoc='center')

plt.show()

























  2.2.3.3 SDMX(Generic)
```

<!-- page: 70 -->
- 호출 URL: `http://kosis.kr/openapi/statisticsData.do`

- 입력 변수
l 자료등록 방법
항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수

userStatsId String 사용자 등록 통계표 필수
type String SDMX의 유형(DSD, Generic, StructureSpecific) 필수
prdSe String 수록주기 필수

startPrdDe String 시작수록시점 선택
시점기준
endPrdDe String 종료수록시점 (시점기준 또는
최신자료 newEstPrdCnt String 최근수록시점 개수 최신자료기준 택1)
기준 prdInterval String 수록시점 간격
format String 결과 유형(json, sdmx) 필수
생략시 구버전으로
version String 결과값 구분
데이터 출력
l 통계표선택 방법
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수
tblId String 통계표 ID 필수
objL2 ~ objL8 String 분류2(두번째 분류코드) ~ 분류8(여덟째 분류코드) 선택

itmId String 항목 필수
type String SDMX의 유형(DSD, Generic, StructureSpecific) 필수
prdSe String 수록주기 필수
startPrdDe String 시작수록시점 선택
시점기준
endPrdDe String 종료수록시점 (시점기준 또는
최신자료 newEstPrdCnt String 최근수록시점 개수 최신자료기준 택1)
기준 prdInterval String 수록시점 간격

format String 결과 유형(json, sdmx) 필수
생략시 구버전으로
version String 결과값 구분
데이터 출력

<!-- page: 71 -->

- 출력 변수
항목명(영문) 항목설명

ID 기관코드_통계표ID
Name 통계표명

Prepared 전송시간
Id 전송기관
Header
Name 전송기관명
Sender
Department 담당부서
Contact
Telephone 담당부서 연락처
Source 출처
Id 시리즈키ID
SeriesKey Value value 시리즈키값

UNIT 단위
Series ObsDimen
Value 시점
sion
Obs
ObsValue Value 수치자료값
LstChnDe Value 최종수정일

- 예제 소스 결과(막대차트)

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 막대차트를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여












   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml
1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<xml:namespace prefix="v"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/ext/script/jquery-1.
6.1.min.js"></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
2/js/jquery.SimpleChart.js"></script>
<script type="text/javascript" language="JavaScript">

// window onload 되었을때 실행 함수
$(document).ready(function(){
getSubList();
});
/****************************************************
* 통계자료 조회 함수
****************************************************/
function getSubList() {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/Expt/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTM
wOWRjNjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2
/1/20191106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1",
data: "",
async : true,
dataType: "xml",
success:function(object)
{

var data = object.documentElement.childNodes[1].childNodes[0].childNodes;

// 차트에 보여주기위해 값을 담고있을 배열변수를 선언
var aData = new Array();

// 데이터를 배열변수에 적재
for(var i=0; i < data.length; i++) {

aData[i] = [data[i].attributes[0].value.replace(/,/gi,''), data[i].attributes[1].value, 'pink'];
}













// 차트를 그리기위한 옵션을 정의
var options = {'BarSize': '20px', 'BarSpace': '2px', 'type' : 'horizontal', 'Font': '2px'}

// 차트를 화면에 출력
$("#chart2").SimpleChart(aData,options);
},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}

</script>
</head>
<body>
<div id="chart2" style="padding-top:30px;"></div>
</body>
</html>
```

<!-- page: 73 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)
library(XML)


rm(list = ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsData.do' # 요청URL

res <-
 GET(
  url = baseurl,
  query = list(
   method = 'getList',
   format = 'sdmx',
   apiKey = v_apiKey %>% I(),
   userStatsId = 'openapisample/101/DT_1IN1502/2/1/20191106094026_1',
   # 시계열 조회 키캆
   jsonVD = 'Y',
   type = 'StructureSpecific',
   prdSe = 'Y',
   newEstPrdCnt = 3,
   # 최근수록시점 개수
   prdInterval = 1,
   # 수록시점 간격
   version = 'v2_1'
  )
 )














docParse <- xmlParse(res)

tbl_title <- xmlToList(docParse)$Header$Name # 통계표명
docList <- xmlToList(docParse)$DataSet$Series

df_lists <- data.frame()

for (i in 1:length(docList)) {
 if (length(docList[i]$Obs) == 2) {
  df_lists <-
   rbind(df_lists, cbind(
    prd_de = paste(docList[i]$Obs[2]),
    dt = paste(docList[i]$Obs[1])
   ))
 }
}

# 바차트
ggplot(df_lists, aes(x = prd_de, y = dt, fill = prd_de)) + xlab("시점") + ylab("") + ggtitle(tbl_title) + geom_bar(st
at = "identity")
```

<!-- page: 74 -->
### 예제 소스 (Python)

```python
import matplotlib.pyplot as plt
import requests
from bs4 import BeautifulSoup

# 한글 폰트 사용을 위해서 세팅
from matplotlib import font_manager, rc
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc('font', family=font)
#url을 통해 sdmx 데이터 가져오기
open_url = 'https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWRj
NjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2/1/201
91106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1'

res = requests.get(open_url)
soup = BeautifulSoup(res.content, 'html.parser')


#변수 지정 및 데이터 저장
xAxis = []
yAxis = []
title = soup.find('common:name').text #차트제목

dataList = soup.find_all('obs')














for item in dataList:
  xAxis.append(item.get('time_period')) #년도 데이터
  yAxis.append(int(item.get('obs_value'))) #값/비율 데이터

#Bar차트 그리기
plt.bar(xAxis, yAxis)
plt.title(title)



#y축 수치를 안보이게 하는 코드. 필요에 따라 선택하여 사용
plt.gca().axes.yaxis.set_visible(False)

#Bar의 가운데에 text로 수치 표시
for i, v in enumerate(xAxis):
  plt.text(v, yAxis[i], yAxis[i],
       fontsize = 9,
       color='blue',
       horizontalalignment='center',
       verticalalignment='bottom')

plt.show()
```

<!-- page: 75 -->
- 예제 소스 결과(파이차트)

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 파이차트를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->












<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml
1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<xml:namespace prefix="v"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/ext/script/jquery-1.
6.1.min.js"></script>
<script type="text/javascript" language="JavaScript">

// window onload 되었을때 실행 함수
$(document).ready(function(){
getSubList();
});

/****************************************************
* 통계자료 조회 함수
****************************************************/
function getSubList() {
// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/Expt/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTM
wOWRjNjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2
/1/20191106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1",
data: "",
async : true,
dataType: "xml",
success:function(object)
{

var mapdata = object.documentElement.childNodes[1].childNodes[0].childNodes;

// 차트에 보여주기위해 값을 담고있을 배열변수를 선언
var data = new Array(mapdata.length);

// 데이터를 배열변수에 적재
for(var i=0;i<mapdata.length;i++) {
data[i] = mapdata[i].attributes[0].value;
}

// 파이차트를 출력하기위한 JavaScript Start
var canvas = document.getElementById("chartcanvas");
var context = canvas.getContext("2d");
var sw = canvas.width;












var sh = canvas.height;
var PADDING=100;

//Browser별 색상 lawngreen, blue, deeppink, aquamarine3, magenta, gold
var colors = ["#7cfc00", "#0000ff", "#ff1493", "#66CDAA", "#ff00ff", "#FFD700"];

var center_X=sw/2; //원의 중심 x 좌표
var center_Y=sh/2; //원의 중심 y 좌표
// 두 계산값 중 작은 값은 값을 원의 반지름으로 설정
var radius = Math.min(sw-(PADDING*2), sh-(PADDING*2)) / 2;
var angle = 0;
var total = 0;

for (var i in data) { total += Number(data[i]); } //데이터(data)의 총합 계산

for (var i = 0; i < data.length; i++) {

context.fillStyle = colors[i]; //생성되는 부분의 채울 색 설정
context.beginPath();
context.moveTo(center_X, center_Y); //원의 중심으로 이동
context.arc(center_X, center_Y, radius, angle, angle +(Math.PI*2*(data[i]/total)));
context.lineTo(center_X,center_Y);
context.fill();
angle += Math.PI*2*(data[i]/total);
}
// 파이차트를 출력하기위한 JavaScript End
},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}
</script>
</head>
<body>
<canvas id="chartcanvas" width="500" height="400"></canvas>
</html>
```

<!-- page: 77 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)
library(XML)
library(ggplot2)

rm(list = ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsData.do' # 요청URL
res <-













 GET(
  url = baseurl,
  query = list(
   method = 'getList',
   format = 'sdmx',
   apiKey = v_apiKey %>% I(),
   userStatsId = 'openapisample/101/DT_1IN1502/2/1/20191106094026_1',
   # 시계열 조회 키캆
   jsonVD = 'Y',
   type = 'StructureSpecific',
   prdSe = 'Y',
   newEstPrdCnt = 3,
   # 최근수록시점 개수
   prdInterval = 1,
   # 수록시점 간격
   version = 'v2_1'
  )
 )

docParse <- xmlParse(res)

v_tbl_nm <- xmlToList(docParse)$Header$Name # 통계표명
docList <- xmlToList(docParse)$DataSet$Series
df_lists <- data.frame()

for (i in 1:length(docList)) {
 if (length(docList[i]$Obs) == 2) {
  df_lists <-
   rbind(df_lists, cbind(
    prd_de = paste(docList[i]$Obs[2]),
    dt = paste(docList[i]$Obs[1])
   ))
 }
}

# 파이차트 비율 라벨 값
pct <-
 round(as.numeric(df_lists$dt) / sum(as.numeric(df_lists$dt)) * 100, 1)
df_lists <- data.frame(df_lists, pct = pct)


# 파이차트
ggplot(df_lists, aes(
 x = factor(1),
 y = '',
 fill = factor(prd_de)
)) +
 geom_bar(stat = 'identity') +
 theme_void() +
 ggtitle(v_tbl_nm) +
 coord_polar('y', start = 0) +
 geom_text(aes(label = paste0(round(pct, 1), '%')),












       position = position_stack(vjust = 0.5))
```

<!-- page: 79 -->
### 예제 소스 (Python)

```python
import matplotlib.pyplot as plt
import requests
from bs4 import BeautifulSoup

# 한글 폰트 사용을 위해서 세팅
from matplotlib import font_manager, rc
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc('font', family=font)

#url을 통해 sdmx 데이터 가져오기
open_url = 'https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWRj
NjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2/1/201
91106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1'

res = requests.get(open_url)
soup = BeautifulSoup(res.content, 'html.parser')

#변수 지정 및 데이터 저장
labels = []
ratio = []
title = soup.find('common:name').text #차트제목

dataList = soup.find_all('obs')

for item in dataList:
  labels.append(item.get('time_period')) #년도 데이터
  ratio.append(item.get('obs_value')) #값/비율 데이터

#Pie차트 그리기
plt.pie(ratio, labels=labels, autopct='%.1f%%')
plt.title(title)
plt.show()
```

<!-- page: 79 -->
- 예제 소스 결과(표차트)

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 통계표를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml
1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<xml:namespace prefix="v"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/ext/script/jquery-1.
6.1.min.js"></script>
<script type="text/javascript" language="JavaScript">
// window onload 되었을때 실행 함수
$(document).ready(function(){
getSubList();
});

var strUnitId, strItmId, strC1;

/****************************************************
* 통계자료 조회 함수
****************************************************/
function getSubList() {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/Expt/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTM
wOWRjNjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2
/1/20191106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1",
data: "",
sync : true,
dataType: "xml",
success:function(object)
{

var mapdata = object.documentElement.childNodes[1].childNodes[0].childNodes;













// 항목, 분류, 단위의 명칭을 조회하기위해 각각의 코드를 변수에 저장
for(var i=0;i<object.documentElement.childNodes[1].childNodes[0].attributes.length;i++) {

if (object.documentElement.childNodes[1].childNodes[0].attributes[i].nodeName == "ITEM") {

strItmId = object.documentElement.childNodes[1].childNodes[0].attributes[i].value;
} else if (object.documentElement.childNodes[1].childNodes[0].attributes[i].nodeName == "C_HJG") {

strC1 = object.documentElement.childNodes[1].childNodes[0].attributes[i].value;
} else if (object.documentElement.childNodes[1].childNodes[0].attributes[i].nodeName == "UNIT") {

strUnitId = object.documentElement.childNodes[1].childNodes[0].attributes[i].value;
}
}
var strTable = "";

// 조회된 결과를 이용하여 통계표 작성
strTable += "<p style='position:absolute; top:32px; left:450px;' id='unitId'></p>";
strTable += "<table cellpadding='0' cellspacing='0' class='TB02' summary='' style='margin-top:15px;width:500p
x;'>";
strTable += "<thead>";
strTable += "<tr id = 'theadId'>";

strTable += "</tr>";
strTable += "</thead>";
strTable += "<tbody>";
for(var i=0;i<mapdata.length;i++) {
strTable += "<tr>";
strTable += "<td class='al_C'>" + mapdata[i].attributes[1].value + "</td>";
strTable += "<td class='al_C'>" + mapdata[i].attributes[0].value + "</td>";
strTable += "</tr>";
}
strTable += "</tbody>";
strTable += "</table>";

document.getElementById("content").innerHTML = strTable;

fnGetTitle ();
fnGetUnit ();
fnGetItm ();
},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}

/****************************************************
* 통계표 명칭 조회
****************************************************/
function fnGetTitle () {













// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/statisticsData.do?method=getMeta&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=xml&type=TBL&orgId=101&tblId=DT_1B01003",
data: "",
sync : true,
dataType: "xml",
success:function(object)
{

var mapdata = object.documentElement.childNodes[1].childNodes[0].childNodes;

// 조회된 결과를 이용하여 통계표 명칭 작성
var strTable = document.getElementById("content").innerHTML;
document.getElementById("content").innerHTML = "<h5>" + object.documentElement.childNodes[1].childNodes
[0].childNodes[0].data + "</h5>" + strTable;

},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}
/****************************************************
* 항목 명칭 조회
****************************************************/
function fnGetItm () {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/statisticsData.do?method=getMeta&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=xml&type=ITM&orgId=101&tblId=DT_1B01003&objId=ITEM&itmId=" + strItmId,
data: "",
sync : true,
dataType: "xml",
success:function(object)
{
// 분류 명칭 조회
fnGetC1(object.documentElement.childNodes[1].childNodes[0].childNodes[4].childNodes[0].data);
},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}

/****************************************************
* 분류 명칭 조회
****************************************************/
function fnGetC1(itmNm) {













// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/statisticsData.do?method=getMeta&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=xml&type=ITM&orgId=101&tblId=DT_1B01003&objId=HJG&itmId=" + strC1,
data: "",
sync : true,
dataType: "xml",
success:function(object)
{
var strTable = "";

// 조회된 결과를 이용하여 항목, 분류 작성
strTable += "<th class='fst al_C' scope='col'>시점</th>";
strTable += "<th scope='col'>" + itmNm + "(" + object.documentElement.childNodes[1].childNodes[0].childNod
es[4].childNodes[0].data + ")" + "</th>";

document.getElementById("theadId").innerHTML = strTable;

},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}
/****************************************************
* 단위 명칭 조회
****************************************************/
function fnGetUnit () {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/statisticsData.do?method=getMeta&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=xml&type=UNIT&unitId=" + strUnitId,
data: "",
sync : true,
dataType: "xml",
success:function(object)
{

// 조회된 결과를 이용하여 단위 명칭 작성
var mapdata = object.documentElement.childNodes[1].childNodes[0].childNodes;

document.getElementById("unitId").innerHTML = "단위 : " + object.documentElement.childNodes[1].childNodes
[0].childNodes[0].data;

},
error: function(xhr,status,error){
alert("error = " + error);
}












});
}

</script>
</head>
<body>
<div id="content" style="padding-top:30px;"></div>
</html>
```

<!-- page: 84 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)
library(XML)

rm(list = ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsData.do' # 요청URL

res <-
 GET(
  url = baseurl,
  query = list(
   method = 'getList',
   format = 'sdmx',
   apiKey = v_apiKey %>% I(),
   userStatsId = 'openapisample/101/DT_1IN1502/2/1/20191106094026_1', # 시계열 조회 키캆
   jsonVD = 'Y',
   type = 'StructureSpecific',
   prdSe = 'Y',
   newEstPrdCnt = 3, # 최근수록시점 개수
   prdInterval = 1, # 수록시점 간격
   version = 'v2_1'
  )
 )

docParse <- xmlParse(res)

docList <- xmlToList(docParse)$DataSet$Series

df_lists <- data.frame()

for (i in 1:length(docList)) {
 if (length(docList[i]$Obs) == 2) {
  df_lists <-
   rbind(df_lists, cbind(paste(docList[i]$Obs[2]), paste(docList[i]$Obs[1])))
 }
}
colnames(df_lists) <- c("시점", "수치")














View(df_lists)
```

<!-- page: 85 -->
### 예제 소스 (Python)

```python
import matplotlib.pyplot as plt
import requests
from bs4 import BeautifulSoup


# 한글 폰트 사용을 위해서 세팅
from matplotlib import font_manager, rc
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc('font', family=font)



#url을 통해 sdmx 데이터 가져오기
open_url = 'https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWRj
NjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2/1/201
91106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1'

res = requests.get(open_url)
soup = BeautifulSoup(res.content, 'html.parser')

dataList = soup.find_all('obs')


#변수 지정 및 데이터 저장
data = []

for item in dataList:
  value = []
  value.append(item.get('time_period')) #년도 데이터
  value.append(item.get('obs_value')) #값 데이터

  data.append(value)

#Table 만들기
fig, ax = plt.subplots(1,1)
column_labels=["시점", "총인구(전국)"]
ax.axis('tight')
ax.axis('off')
ax.table(cellText=data,colLabels=column_labels,colColours =["yellow"] * 2, loc="center", cellLoc='center')

plt.show()


















  2.2.3.4 SDMX(StructureSpecific)
```

<!-- page: 86 -->
- 호출 URL: `http://kosis.kr/openapi/statisticsData.do`

- 입력 변수
l 자료등록 방법
항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수

userStatsId String 사용자 등록 통계표 필수
type String SDMX의 유형(DSD, Generic, StructureSpecific) 필수
prdSe String 수록주기 필수

startPrdDe String 시작수록시점 선택
시점기준
endPrdDe String 종료수록시점 (시점기준 또는
최신자료 newEstPrdCnt String 최근수록시점 개수 최신자료기준 택1)
기준 prdInterval String 수록시점 간격
format String 결과 유형(json, sdmx) 필수
생략시 구버전으로
version String 결과값 구분
데이터 출력
l 통계표선택 방법
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수
tblId String 통계표 ID 필수
objL2 ~ objL8 String 분류2(두번째 분류코드) ~ 분류8(여덟째 분류코드) 선택

itmId String 항목 필수
type String SDMX의 유형(DSD, Generic, StructureSpecific) 필수
prdSe String 수록주기 필수
startPrdDe String 시작수록시점 선택
시점기준
endPrdDe String 종료수록시점 (시점기준 또는
최신자료 newEstPrdCnt String 최근수록시점 개수 최신자료기준 택1)
기준 prdInterval String 수록시점 간격

format String 결과 유형(json, sdmx) 필수
생략시 구버전으로
version String 결과값 구분
데이터 출력

<!-- page: 87 -->

- 출력 변수
항목명(영문) 항목설명

ID 기관코드_통계표ID
Name 통계표명

Prepared 전송시간
Id 전송기관
Header
Name 전송기관명
Sender
Department 담당부서
Contact
Telephone 담당부서 연락처
Source 출처
UNIT 단위
ITEM 항목

FIEQ 주기
Series C_분류
C_분류
(8개 분류까지 가능)
TIME_PERIOD 시점
OBS
OBS_VALUE 수치자료
- 예제 소스 결과(막대차트)

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 막대차트를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다
 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여













   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml
1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<xml:namespace prefix="v"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/ext/script/jquery-1.
6.1.min.js"></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
2/js/jquery.SimpleChart.js"></script>
<script type="text/javascript" language="JavaScript">

// window onload 되었을때 실행 함수
$(document).ready(function(){
getSubList();
});
/****************************************************
* 통계자료 조회 함수
****************************************************/
function getSubList() {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/Expt/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTM
wOWRjNjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2
/1/20191106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1",
data: "",
async : true,
dataType: "xml",
success:function(object)
{

var data = object.documentElement.childNodes[1].childNodes[0].childNodes;

// 차트에 보여주기위해 값을 담고있을 배열변수를 선언
var aData = new Array();

// 데이터를 배열변수에 적재
for(var i=0; i < data.length; i++) {

aData[i] = [data[i].attributes[0].value.replace(/,/gi,''), data[i].attributes[1].value, 'pink'];
}













// 차트를 그리기위한 옵션을 정의
var options = {'BarSize': '20px', 'BarSpace': '2px', 'type' : 'horizontal', 'Font': '2px'}

// 차트를 화면에 출력
$("#chart2").SimpleChart(aData,options);
},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}

</script>
</head>
<body>
<div id="chart2" style="padding-top:30px;"></div>
</body>
</html>
```

<!-- page: 89 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)
library(XML)


rm(list = ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsData.do' # 요청URL

res <-
 GET(
  url = baseurl,
  query = list(
   method = 'getList',
   format = 'sdmx',
   apiKey = v_apiKey %>% I(),
   userStatsId = 'openapisample/101/DT_1IN1502/2/1/20191106094026_1',
   # 시계열 조회 키캆
   jsonVD = 'Y',
   type = 'StructureSpecific',
   prdSe = 'Y',
   newEstPrdCnt = 3,
   # 최근수록시점 개수
   prdInterval = 1,
   # 수록시점 간격
   version = 'v2_1'
  )
 )














docParse <- xmlParse(res)

tbl_title <- xmlToList(docParse)$Header$Name # 통계표명
docList <- xmlToList(docParse)$DataSet$Series

df_lists <- data.frame()

for (i in 1:length(docList)) {
 if (length(docList[i]$Obs) == 2) {
  df_lists <-
   rbind(df_lists, cbind(
    prd_de = paste(docList[i]$Obs[2]),
    dt = paste(docList[i]$Obs[1])
   ))
 }
}

# 바차트
ggplot(df_lists, aes(x = prd_de, y = dt, fill = prd_de)) + xlab("시점") + ylab("") + ggtitle(tbl_title) + geom_bar(st
at = "identity")
```

<!-- page: 90 -->
### 예제 소스 (Python)

```python
import matplotlib.pyplot as plt
import requests
from bs4 import BeautifulSoup

# 한글 폰트 사용을 위해서 세팅
from matplotlib import font_manager, rc
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc('font', family=font)
#url을 통해 sdmx 데이터 가져오기
open_url = 'https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWRj
NjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2/1/201
91106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1'

res = requests.get(open_url)
soup = BeautifulSoup(res.content, 'html.parser')


#변수 지정 및 데이터 저장
xAxis = []
yAxis = []
title = soup.find('common:name').text #차트제목

dataList = soup.find_all('obs')














for item in dataList:
  xAxis.append(item.get('time_period')) #년도 데이터
  yAxis.append(int(item.get('obs_value'))) #값/비율 데이터

#Bar차트 그리기
plt.bar(xAxis, yAxis)
plt.title(title)



#y축 수치를 안보이게 하는 코드. 필요에 따라 선택하여 사용
plt.gca().axes.yaxis.set_visible(False)

#Bar의 가운데에 text로 수치 표시
for i, v in enumerate(xAxis):
  plt.text(v, yAxis[i], yAxis[i],
       fontsize = 9,
       color='blue',
       horizontalalignment='center',
       verticalalignment='bottom')

plt.show()
```

<!-- page: 91 -->
- 예제 소스 결과(파이차트)

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 파이차트를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml












1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<xml:namespace prefix="v"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/ext/script/jquery-1.
6.1.min.js"></script>
<script type="text/javascript" language="JavaScript">

// window onload 되었을때 실행 함수
$(document).ready(function(){
getSubList();
});

/****************************************************
* 통계자료 조회 함수
****************************************************/
function getSubList() {
// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/Expt/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTM
wOWRjNjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2
/1/20191106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1",
data: "",
async : true,
dataType: "xml",
success:function(object)
{

var mapdata = object.documentElement.childNodes[1].childNodes[0].childNodes;

// 차트에 보여주기위해 값을 담고있을 배열변수를 선언
var data = new Array(mapdata.length);

// 데이터를 배열변수에 적재
for(var i=0;i<mapdata.length;i++) {
data[i] = mapdata[i].attributes[0].value;
}

// 파이차트를 출력하기위한 JavaScript Start
var canvas = document.getElementById("chartcanvas");
var context = canvas.getContext("2d");
var sw = canvas.width;
var sh = canvas.height;












var PADDING=100;

//Browser별 색상 lawngreen, blue, deeppink, aquamarine3, magenta, gold
var colors = ["#7cfc00", "#0000ff", "#ff1493", "#66CDAA", "#ff00ff", "#FFD700"];

var center_X=sw/2; //원의 중심 x 좌표
var center_Y=sh/2; //원의 중심 y 좌표
// 두 계산값 중 작은 값은 값을 원의 반지름으로 설정
var radius = Math.min(sw-(PADDING*2), sh-(PADDING*2)) / 2;
var angle = 0;
var total = 0;

for (var i in data) { total += Number(data[i]); } //데이터(data)의 총합 계산

for (var i = 0; i < data.length; i++) {

context.fillStyle = colors[i]; //생성되는 부분의 채울 색 설정
context.beginPath();
context.moveTo(center_X, center_Y); //원의 중심으로 이동
context.arc(center_X, center_Y, radius, angle, angle +(Math.PI*2*(data[i]/total)));
context.lineTo(center_X,center_Y);
context.fill();
angle += Math.PI*2*(data[i]/total);
}
// 파이차트를 출력하기위한 JavaScript End
},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}
</script>
</head>
<body>
<canvas id="chartcanvas" width="500" height="400"></canvas>
</html>
```

<!-- page: 93 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)
library(XML)
library(ggplot2)

rm(list = ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsData.do' # 요청URL

res <-
 GET(












  url = baseurl,
  query = list(
   method = 'getList',
   format = 'sdmx',
   apiKey = v_apiKey %>% I(),
   userStatsId = 'openapisample/101/DT_1IN1502/2/1/20191106094026_1',
   # 시계열 조회 키캆
   jsonVD = 'Y',
   type = 'StructureSpecific',
   prdSe = 'Y',
   newEstPrdCnt = 3,
   # 최근수록시점 개수
   prdInterval = 1,
   # 수록시점 간격
   version = 'v2_1'
  )
 )

docParse <- xmlParse(res)

v_tbl_nm <- xmlToList(docParse)$Header$Name # 통계표명
docList <- xmlToList(docParse)$DataSet$Series

df_lists <- data.frame()
for (i in 1:length(docList)) {
 if (length(docList[i]$Obs) == 2) {
  df_lists <-
   rbind(df_lists, cbind(
    prd_de = paste(docList[i]$Obs[2]),
    dt = paste(docList[i]$Obs[1])
   ))
 }
}

# 파이차트 비율 라벨 값
pct <-
 round(as.numeric(df_lists$dt) / sum(as.numeric(df_lists$dt)) * 100, 1)
df_lists <- data.frame(df_lists, pct = pct)


# 파이차트
ggplot(df_lists, aes(
 x = factor(1),
 y = '',
 fill = factor(prd_de)
)) +
 geom_bar(stat = 'identity') +
 theme_void() +
 ggtitle(v_tbl_nm) +
 coord_polar('y', start = 0) +
 geom_text(aes(label = paste0(round(pct, 1), '%')),
       position = position_stack(vjust = 0.5))
```

<!-- page: 95 -->
### 예제 소스 (Python)

```python
import matplotlib.pyplot as plt
import requests
from bs4 import BeautifulSoup

# 한글 폰트 사용을 위해서 세팅
from matplotlib import font_manager, rc
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc('font', family=font)

#url을 통해 sdmx 데이터 가져오기
open_url = 'https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWRj
NjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2/1/201
91106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1'

res = requests.get(open_url)
soup = BeautifulSoup(res.content, 'html.parser')

#변수 지정 및 데이터 저장
labels = []
ratio = []
title = soup.find('common:name').text #차트제목

dataList = soup.find_all('obs')

for item in dataList:
  labels.append(item.get('time_period')) #년도 데이터
  ratio.append(item.get('obs_value')) #값/비율 데이터

#Pie차트 그리기
plt.pie(ratio, labels=labels, autopct='%.1f%%')
plt.title(title)
plt.show()
```

<!-- page: 95 -->
- 예제 소스 결과(표차트)

### 예제 소스 (JSP)

```jsp
<!--













 KOSIS OpenAPI를 이용하여 통계표를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml
1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<xml:namespace prefix="v"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/ext/script/jquery-1.
6.1.min.js"></script>
<script type="text/javascript" language="JavaScript">
// window onload 되었을때 실행 함수
$(document).ready(function(){
getSubList();
});

var strUnitId, strItmId, strC1;

/****************************************************
* 통계자료 조회 함수
****************************************************/
function getSubList() {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/Expt/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTM
wOWRjNjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2
/1/20191106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1",
data: "",
sync : true,
dataType: "xml",
success:function(object)
{

var mapdata = object.documentElement.childNodes[1].childNodes[0].childNodes;

// 항목, 분류, 단위의 명칭을 조회하기위해 각각의 코드를 변수에 저장












for(var i=0;i<object.documentElement.childNodes[1].childNodes[0].attributes.length;i++) {

if (object.documentElement.childNodes[1].childNodes[0].attributes[i].nodeName == "ITEM") {

strItmId = object.documentElement.childNodes[1].childNodes[0].attributes[i].value;
} else if (object.documentElement.childNodes[1].childNodes[0].attributes[i].nodeName == "C_HJG") {

strC1 = object.documentElement.childNodes[1].childNodes[0].attributes[i].value;
} else if (object.documentElement.childNodes[1].childNodes[0].attributes[i].nodeName == "UNIT") {

strUnitId = object.documentElement.childNodes[1].childNodes[0].attributes[i].value;
}
}
var strTable = "";

// 조회된 결과를 이용하여 통계표 작성
strTable += "<p style='position:absolute; top:32px; left:450px;' id='unitId'></p>";
strTable += "<table cellpadding='0' cellspacing='0' class='TB02' summary='' style='margin-top:15px;width:500p
x;'>";
strTable += "<thead>";
strTable += "<tr id = 'theadId'>";

strTable += "</tr>";
strTable += "</thead>";
strTable += "<tbody>";
for(var i=0;i<mapdata.length;i++) {
strTable += "<tr>";
strTable += "<td class='al_C'>" + mapdata[i].attributes[1].value + "</td>";
strTable += "<td class='al_C'>" + mapdata[i].attributes[0].value + "</td>";
strTable += "</tr>";
}
strTable += "</tbody>";
strTable += "</table>";

document.getElementById("content").innerHTML = strTable;

fnGetTitle ();
fnGetUnit ();
fnGetItm ();
},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}

/****************************************************
* 통계표 명칭 조회
****************************************************/
function fnGetTitle () {

// ajax 통신을 위한 호출 함수












$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/statisticsData.do?method=getMeta&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=xml&type=TBL&orgId=101&tblId=DT_1B01003",
data: "",
sync : true,
dataType: "xml",
success:function(object)
{

var mapdata = object.documentElement.childNodes[1].childNodes[0].childNodes;

// 조회된 결과를 이용하여 통계표 명칭 작성
var strTable = document.getElementById("content").innerHTML;
document.getElementById("content").innerHTML = "<h5>" + object.documentElement.childNodes[1].childNodes
[0].childNodes[0].data + "</h5>" + strTable;

},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}
/****************************************************
* 항목 명칭 조회
****************************************************/
function fnGetItm () {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/statisticsData.do?method=getMeta&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=xml&type=ITM&orgId=101&tblId=DT_1B01003&objId=ITEM&itmId=" + strItmId,
data: "",
sync : true,
dataType: "xml",
success:function(object)
{
// 분류 명칭 조회
fnGetC1(object.documentElement.childNodes[1].childNodes[0].childNodes[4].childNodes[0].data);
},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}

/****************************************************
* 분류 명칭 조회
****************************************************/
function fnGetC1(itmNm) {













// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/statisticsData.do?method=getMeta&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=xml&type=ITM&orgId=101&tblId=DT_1B01003&objId=HJG&itmId=" + strC1,
data: "",
sync : true,
dataType: "xml",
success:function(object)
{
var strTable = "";

// 조회된 결과를 이용하여 항목, 분류 작성
strTable += "<th class='fst al_C' scope='col'>시점</th>";
strTable += "<th scope='col'>" + itmNm + "(" + object.documentElement.childNodes[1].childNodes[0].childNod
es[4].childNodes[0].data + ")" + "</th>";

document.getElementById("theadId").innerHTML = strTable;

},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}
/****************************************************
* 단위 명칭 조회
****************************************************/
function fnGetUnit () {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/statisticsData.do?method=getMeta&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=xml&type=UNIT&unitId=" + strUnitId,
data: "",
sync : true,
dataType: "xml",
success:function(object)
{

// 조회된 결과를 이용하여 단위 명칭 작성
var mapdata = object.documentElement.childNodes[1].childNodes[0].childNodes;

document.getElementById("unitId").innerHTML = "단위 : " + object.documentElement.childNodes[1].childNodes
[0].childNodes[0].data;

},
error: function(xhr,status,error){
alert("error = " + error);
}
});












}

</script>
</head>
<body>
<div id="content" style="padding-top:30px;"></div>
</html>
```

<!-- page: 100 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)
library(XML)

rm(list = ls()) # 모든변수 초기화

# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsData.do' # 요청URL

res <-
 GET(
  url = baseurl,
  query = list(
   method = 'getList',
   format = 'sdmx',
   apiKey = v_apiKey %>% I(),
   userStatsId = 'openapisample/101/DT_1IN1502/2/1/20191106094026_1', # 시계열 조회 키캆
   jsonVD = 'Y',
   type = 'StructureSpecific',
   prdSe = 'Y',
   newEstPrdCnt = 3, # 최근수록시점 개수
   prdInterval = 1, # 수록시점 간격
   version = 'v2_1'
  )
 )

docParse <- xmlParse(res)

docList <- xmlToList(docParse)$DataSet$Series

df_lists <- data.frame()

for (i in 1:length(docList)) {
 if (length(docList[i]$Obs) == 2) {
  df_lists <-
   rbind(df_lists, cbind(paste(docList[i]$Obs[2]), paste(docList[i]$Obs[1])))
 }
}

colnames(df_lists) <- c("시점", "수치")













View(df_lists)
```

<!-- page: 101 -->
### 예제 소스 (Python)

```python
import matplotlib.pyplot as plt
import requests
from bs4 import BeautifulSoup


# 한글 폰트 사용을 위해서 세팅
from matplotlib import font_manager, rc
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc('font', family=font)



#url을 통해 sdmx 데이터 가져오기
open_url = 'https://kosis.kr/openapi/statisticsData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOWRj
NjgxN2MzNDgwNmY=&format=sdmx&type=StructureSpecific&userStatsId=openapisample/101/DT_1IN1502/2/1/201
91106094026_1&prdSe=Y&newEstPrdCnt=3&version=v2_1'

res = requests.get(open_url)
soup = BeautifulSoup(res.content, 'html.parser')

dataList = soup.find_all('obs')


#변수 지정 및 데이터 저장
data = []

for item in dataList:
  value = []
  value.append(item.get('time_period')) #년도 데이터
  value.append(item.get('obs_value')) #값 데이터

  data.append(value)

#Table 만들기
fig, ax = plt.subplots(1,1)
column_labels=["시점", "총인구(전국)"]
ax.axis('tight')
ax.axis('off')
ax.table(cellText=data,colLabels=column_labels,colColours =["yellow"] * 2, loc="center", cellLoc='center')

plt.show()
```

<!-- page: 102 -->
### 2.3 대용량 통계자료

- 통계표의 수치자료 및 메타정보 제공을 위한 OpenAPI로, 통계표 전체, 분류 전체(일부), 항목

전체(일부)를 선택적으로 요청합니다.

2.
### 3.1 특징

- 통계표의 수치자료를 다중계열, 여러시점으로 제공
- 통계표의 수록정보, 분류/항목, 출처, 단위 등 메타정보 제공
- 자료 제공형태: SDMX (DSD, Generic, StructureSpecific), CSV

2.
### 3.2 서비스 활용

2.
3.
### 2.1 자료등록

- 개발가이드 > 대용량 통계자료 > URL생성 > 자료등록
‘작성기관’, ‘통계조사명’, ‘통계표명’ 등을 입력하여 사용하고자 하는 자료를 조회한 뒤 조회결과에
서 등록할 자료의 ①사용여부 항목을 선택하고 ②통계표 등록 버튼을 누릅니다. ③통계표조회 버튼
을 클릭하면 해당 자료의 통계표를 볼 수 있습니다.

<!-- page: 103 -->

2.
3.
### 2.2 등록된 자료

- 마이페이지 > 등록한 자료 > 대용량통계자료
자료등록의 통계표 등록을 마치고 등록된 자료 탭을 클릭하면, 이용자가 등록한 자료들의 목록이
나타나며, 등록된 자료 중 URL생성을 원하는 자료의 ①URL 생성 버튼을 누릅니다. ②통계표조회
버튼을 클릭하면 해당 자료의 통계표를 볼 수 있습니다.

- 마이페이지 > 등록한 자료 > 대용량통계자료 > 삭제
①버튼을 클릭한 후 하단에 조회되는 사용자 생성 URL 목록을 ②삭제할 수 있습니다.

<!-- page: 104 -->

2.
3.
### 2.3 URL생성

- 개발가이드 > 통계자료 > 자료등록 URL생성 > 등록된 자료 > URL 생성
URL생성 단계에서는 URL생성 조건 설정의 ‘활용 자료명’, ’분류/항목선택’을 입력 후 ①URL생
성 버튼을 누르면 URL생성 상세조건 화면으로 이동 후 URL이 하단에 생성됩니다. URL생성 상세
조건 화면에서 상세설정 후 ②URL보기, 결과값보기 버튼을 클릭하여 페이지 하단에서 결과를
확인 할 수 있고, ③URL복사 버튼을 누르면 생성된 URL이 클립보드에 복사됩니다.

<!-- page: 105 -->

<!-- page: 106 -->

2.
### 3.3 활용방법

2.
3.
### 3.1 SDMX(DSD)

- 호출 URL: `http://kosis.kr/openapi/statisticsBigData.do`
- 입력 변수

항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수
userStatsId String 사용자 등록 통계표 필수

type String SDMX의 유형(DSD, Generic, StructureSpecific) 필수
format String 결과 유형(json, sdmx) 필수
생략시 구버전으로 데이터
version String 결과값 구분
출력
- 출력 변수
항목명(영문) 항목설명
ID 기관코드_통계표ID

Name 통계표명
Prepared 전송시간
Id 전송기관
Header
Name 전송기관명
Sender
Department 담당부서
Contact
Telephone 담당부서 연락처
Source 출처
Id 코드리스트ID
Name 코드리스트명
Codelist Codelist Description 코드리스트영문명
Id 코드ID
Code
Name 코드명
Id 컨셉스키마ID
Name 컨셉스키마명
ConceptsSche Description 컨셉스키마영문명
Concepts
me Id 컨셉ID
concept Name 컨셉명
Description 컨셉영문명
Id 통계표ID
Name 통계표명
DataStructures DataStructure
Id 디멘젼Id
DataStructureComponents Dimension ConceptI Id
Id
dentity

<!-- page: 107 -->

2.
3.
### 3.2 SDMX(Generic)

- 호출 URL: `http://kosis.kr/openapi/statisticsBigData.do`
- 입력 변수

항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수
userStatsId String 사용자 등록 통계표 필수

type String SDMX의 유형(DSD, Generic, StructureSpecific) 필수
prdSe String 수록주기 필수
startPrdDe String 시작수록시점 선택
시점기준
endPrdDe String 종료수록시점 (시점기준 또는
최신자료 newEstPrdCnt String 최근수록시점 개수 최신자료기준 택1)
기준 prdInterval String 수록시점 간격
format String 결과 유형(json, sdmx) 필수
생략시 구버전으로
version String 결과값 구분
데이터 출력

- 출력 변수

항목명(영문) 항목설명

ID 기관코드_통계표ID
Name 통계표명

Prepared 전송시간

Id 전송기관
Header
Name 전송기관명
Sender
Department 담당부서
Contact
Telephone 담당부서 연락처
Source 출처
Id 시리즈키ID
SeriesKey Value
value 시리즈키값
Series
ObsDimension Value 시점
Obs
ObsValue Value 수치자료값

<!-- page: 108 -->

2.
3.
### 3.3 SDMX(StructureSpecific)

- 호출 URL: `http://kosis.kr/openapi/statisticsBigData.do`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
userStatsId String 사용자 등록 통계표 필수
type String SDMX의 유형(DSD, Generic, StructureSpecific) 필수
prdSe String 수록주기 필수

startPrdDe String 시작수록시점 선택
시점기준
endPrdDe String 종료수록시점 (시점기준 또는
최신자료 newEstPrdCnt String 최근수록시점 개수 최신자료기준 택1)
기준 prdInterval String 수록시점 간격
format String 결과 유형(json, sdmx) 필수
생략시 구버전으로
version String 결과값 구분
데이터 출력

- 출력 변수
항목명(영문) 항목설명

ID 기관코드_통계표ID
Name 통계표명

Prepared 전송시간
Id 전송기관
Header
Name 전송기관명
Sender
Department 담당부서
Contact
Telephone 담당부서 연락처
Source 출처
UNIT 단위
ITEM 항목

FREQ 주기
Series
분류 분류
ObsDimension Value 시점
Obs
ObsValue Value 수치자료값

<!-- page: 109 -->

2.
3.
### 3.4 XLS

- 호출 URL: `http://kosis.kr/openapi/statisticsBigData.do`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
userStatsId String 사용자 등록 통계표 필수

prdSe String 수록주기 필수

startPrdDe String 시작수록시점
시점기준
endPrdDe String 종료수록시점
선택
(시점기준 또는
newEstPrdCnt String 최근수록시점 개수
최신자료기준 택1)
최신자료기준
prdInterval String 수록시점 간격
format String 결과 유형(json, sdmx) 필수

- 출력 결과 예시

<!-- page: 110 -->

### 2.4 통계설명

- 통계조사에 대한 설명자료 제공을 위한 OpenAPI입니다.

2.
### 4.1 특징

- 자료 제공형태: XML, JSON

2.
### 4.2 서비스 활용

2.
4.
### 2.1 URL생성

- 개발가이드 > 통계설명 > URL생성
URL생성 단계에서는 URL생성 조건 설정의 ‘통계조사’, ‘설명항목’, ’설명자료’ 를 입력 후 ①URL
복사, 결과값보기 버튼을 클릭하여 페이지 하단에서 결과를 확인 할 수 있습니다.

<!-- page: 111 -->

2.
### 4.3 활용방법

2.
4.
### 3.1 JSON

- 호출 URL: `http://kosis.kr/openapi/statisticsExplData.do`
- 입력 변수

항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수
statId
* orgId(기관ID) + String 통계조사 ID 필수

tblId(통계표ID) 로도 가능
필수
전체 - All
조사명-statsNm
작성유형-statsKind
통계종류-statsEnd
계속여부-statsContinue

법적근거-basisLaw
조사목적-writingPurps
조사기간-examinPd
조사주기-statsPeriod
조사체계-writingSystem

연락처-writingTel
통계(활용)분야·실태-statsField
조사 대상범위-examinObjrange
조사 대상지역-examinObjArea
metaItm String 요청 항목
조사단위 및 조사대상규모-josaUnit
적용분류-applyGroup
조사항목-josaItm
공표주기-pubPeriod
공표범위-pubExtent
공표시기-pubDate
공표방법 및 URL-publictMth

조사대상기간 및 조사기준시점-exami
nTrgetPd
자료이용시 유의사항 -dataUserNote
주요 용어해설-mainTermExpl
자료 수집방법-dataCollectMth
조사연혁-examinHistory

승인번호-confmNo
승인일자-confmDt
format String 결과유형(JSON, SDMX) 필수
content String 헤더 유형(html, json) 선택

<!-- page: 112 -->

- 출력 변수

항목명(영문) 항목설명 형식
statsNm 조사명 VARCHAR2(4000)

statsKind 작성유형 VARCHAR2(4000)
statsEnd 통계종류 VARCHAR2(4000)
statsContinue 계속여부 VARCHAR2(4000)

basisLaw 법적근거 VARCHAR2(4000)
writingPurps 조사목적 VARCHAR2(4000)
examinPd 조사기간 VARCHAR2(4000)
statsPeriod 조사주기 VARCHAR2(4000)

writingSystem 조사체계 VARCHAR2(4000)
writingTel 연락처 VARCHAR2(8000)
statsField 통계(활용)분야·실태 VARCHAR2(4000)
examinObjrange 조사 대상범위 VARCHAR2(4000)

examinObjArea 조사 대상지역 VARCHAR2(4000)
josaUnit 조사단위 및 조사대상규모 VARCHAR2(4000)
applyGroup 적용분류 VARCHAR2(4000)
josaItm 조사항목 VARCHAR2(4000)

pubPeriod 공표주기 VARCHAR2(4000)
pubExtent 공표범위 VARCHAR2(4000)
pubDate 공표시기 VARCHAR2(4000)

publictMth 공표방법 및 URL VARCHAR2(4000)
examinTrgetPd 조사대상기간 및 조사기준시점 VARCHAR2(4000)
dataUserNote 자료이용자 유의사항 VARCHAR2(4000)
mainTermExpl 주요 용어해설 VARCHAR2(4000)

dataCollectMth 자료 수집방법 VARCHAR2(4000)
examinHistory 조사연혁 VARCHAR2(4000)
confmNo 승인번호 VARCHAR2(4000)
confmDt 승인일자 VARCHAR2(4000)

- 예제 소스 결과

<!-- page: 113 -->

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 통계설명자료를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml
1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
4/js/dojo.js" ></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
4/js/json.js" ></script>
<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/devGuide/devGuide0
4/js/ajax.js"></script>
<script type="text/javascript" language="JavaScript">

var mapData;

// window onload 되었을때 실행 함수
dojo.addOnLoad ( function() {

// 통계설명자료를 조회하기위해 함수를 호출한다.
getSubList("ALL", "1962009");
});
/****************************************************
* 통계목록 리스트 조회 함수
* parameter : metaItm - 요청 항목
* statId - 통계조사 Id
****************************************************/
function getSubList(metaItm, statId) {

// ajax 통신을 위한 파라메터를 변수에 담는다.
var paraObj = {
// 임의의 jsp 페이지를 호출함으로써 cross domain 제약을 우회할 수 있다.
url : "http://mgmk.kosis.kr/openapi_dev/devGuidePop.jsp?method=getList&key=ZjZjOTI3MjRjNmU1YzdhZTMwOWRj
NjgxN2MzNDgwNmY=&metaItm=" + metaItm + "&statId=" + statId + "&type=json",













sync : true,
load : function(resObj, a, b) { mapData = resObj; },
error : function ( resObj, e ) { alert(dojo.toJson(resObj)); }
}

sendPost( paraObj );

var nodeInfo="";

// 통계설명자료를 화면에 출력하기 위해 변수에 적재
nodeInfo= "<table cellpadding='0' cellspacing='0' class='TB02' summary=''>";
nodeInfo+=" <thead>"
nodeInfo+=" <tr>"
nodeInfo+=" <th class='fst al_C' scope='col' style='width:20%;'>항목</th>"
nodeInfo+=" <th scope='col'>설명</th>"
nodeInfo+=" </tr>"
nodeInfo+=" </thead>"
nodeInfo+=" <tbody>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사명</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].statsNm+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>작성유형</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].statsKind+"</td>"
nodeInfo+=" </tr>“
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>통계종류</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].statsEnd+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>계속여부</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].statsContinue+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>법적근거</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].basisLaw+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사목적</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].writingPurps+"</td>"
nodeInfo+=" </tr>“
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사기간</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].examinPd+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사주기</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].statsPeriod+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사체계</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].writingSystem+"</td>"











nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>연락처</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].writingTel+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>통계(활용)분야·실태</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].statsField+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사대상범위</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].examinObjrange+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사대상지역</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].examinObjArea+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사단위및조사대상규모</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].josaUnit+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>적용분류</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].applyGroup+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사항목</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].josaItm+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>공표주기</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].pubPeriod+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>공표범위</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].pubExtent+"</td>"
nodeInfo+=" </tr>“
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>공표시기</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].pubDate+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>공표방법및URL</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].publictMth+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사대상기간및조사기준시점</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].examinTrgetPd+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>자료이용자유의사항</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].dataUserNote+"</td>"
nodeInfo+=" </tr>"











nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>주요용어해설</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].mainTermExpl+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>자료수집방법</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].dataCollectMth+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사연혁</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].examinHistory+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>승인번호</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].confmNo+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>승인일자</td>"
nodeInfo+=" <td class='al_C'>"+mapData[0].confmDt+"</td>"
nodeInfo+=" </tr>"
nodeInfo+=" </tbody>"
nodeInfo+="</table>"

// 변수에 적재된 UI를 화면에 출력
var r_node = document.getElementById("content");
r_node.innerHTML =nodeInfo;
}
</script>
</head>
<body>
<div id="content" ></div>
</body>
</html>


// cross domain 제약을 우회하기 위한 jsp (devGuidePop.jsp)
<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core" %>

<c:set var="method" ><%out.println(request.getParameter("method") == null ? "" : (request.getParameter("metho
d"))); %></c:set>
<c:set var="key" ><%out.println(request.getParameter("key") == null ? "" : (request.getParameter("key"))); %></
c:set>
<c:set var="metaItm" ><%out.println(request.getParameter("metaItm") == null ? "" : (request.getParameter("met
aItm")));%></c:set>
<c:set var="statId" ><%out.println(request.getParameter("statId") == null ? "" : (request.getParameter("statId")));
%></c:set>
<c:set var="type" ><%out.println(request.getParameter("type") == null ? "" : (request.getParameter("type"))); %>
</c:set>

<c:import url="http://mgmk.kosis.kr/openapi_dev/Expt/statisticsExplData.do?method=${method}&apiKey=${key}&
metaItm=${metaItm}&statId=${statId}&format=${type}" charEncoding="utf-8"/>
```

<!-- page: 117 -->
### 예제 소스 (R)

```r
library(httr)
library(rvest)
library(jsonlite)
library(dplyr)

rm(list = ls()) # 모든변수 초기화

all_items <- data.frame(
 ename = c(
  'statsNm',
  'statsKind',
  'statsEnd',
  'statsContinue',
  'basisLaw',
  'writingPurps',
  'examinPd',
  'statsPeriod',
  'writingSystem',
  'writingTel',
  'statsField',
  'examinObjrange',
  'examinObjArea',
  'josaUnit',
  'applyGroup',
  'josaItm',
  'pubPeriod',
  'pubExtent',
  'pubDate',
  'publictMth',
  'examinTrgetPd',
  'dataUserNote',
  'mainTermExpl',
  'dataCollectMth',
  'examinHistory',
  'confmNo',
  'confmDt'
 ),
 hname = c(
  '조사명',
  '작성유형',
  '통계종류',
  '계속여부',
  '법적근거',
  '조사목적',
  '조사기간',
  '조사주기',
  '조사체계',
  '연락처',
  '통계(활용)분야·실태',
  '조사 대상범위',
  '조사 대상지역',











  '조사단위 및 조사대상규모',
  '적용분류',
  '조사항목',
  '공표주기',
  '공표범위',
  '공표시기',
  '공표방법 및 URL',
  '조사대상기간 및 조사기준시점',
  '자료이용자 유의사항',
  '주요 용어해설',
  '자료 수집방법',
  '조사연혁',
  '승인번호',
  '승인일자'
 )
)


# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsExplData.do?'

res <- GET(
 url = baseurl,
 query = list(
  method = 'getList',
  format = 'json',
  jsonVD = 'Y',
  apiKey = v_apiKey,
  statId = '1962009',
  metaItm = 'ALL'
 )
)
res %>% content(as = 'text', encoding = 'UTF-8') %>% fromJSON() -> json
df_lists <- data.frame()
json_names <- names(json)

for (i in 1:length(all_items$ename)) {
 if (is.na(match(all_items$ename[i], json_names))==FALSE) {
  v_desc <- select(json, all_items$ename[i])

  df_lists <-
   rbind(df_lists, c(all_items$hname[i], paste(na.omit(v_desc))))
 }

}

colnames(df_lists) <- c("항목", "내용")

View(df_lists)
```

<!-- page: 119 -->
### 예제 소스 (Python)

```python
import sys
import json
from urllib.request import urlopen
from PyQt5.QtWidgets import *
# 한글 폰트 사용을 위해서 세팅
from matplotlib import font_manager, rc
font_path = "C:/Windows/Fonts/malgun.ttf"
font = font_manager.FontProperties(fname=font_path).get_name()
rc('font', family=font)


#url을 통해 json 데이터 가져오기
with urlopen("http://kosis.kr/openapi/statisticsExplData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwO
WRjNjgxN2MzNDgwNmY=&format=json&jsonVD=Y&statId=1962009&metaItm=All") as url:
  json_file = url.read()

py_json = json.loads(json_file.decode('utf-8'))

#변수 지정 및 데이터 저장
data = []

for i, v in enumerate(py_json): #i는 인덱스를 나타냄
  #print(json.loads(json_file[i]))
  value = []
  if 'statsNm' in v:
    value.append("조사명")
    value.append(v['statsNm'])
    data.append(value)

  if 'statsKind' in v:
    value.append("통계종류")
    value.append(v['statsKind'])
    data.append(value)
  if 'statsContinue' in v:
    value.append("계속여부")
    value.append(v['statsContinue'])
    data.append(value)

  if 'basisLaw' in v:
    value.append("법적근거")
    value.append(v['basisLaw'])
    data.append(value)

  if 'writingPurps' in v:
    value.append("조사목적")
    value.append(v['writingPurps'])
    data.append(value)

  if 'statsPeriod' in v:
    value.append("조사주기")












    value.append(v['statsPeriod'])
    data.append(value)

  if 'writingSystem' in v:
    value.append("조사체계")
    value.append(v['writingSystem'])
    data.append(value)

  #if 'pubExtent' in v:
    #value.append("공표단위")
    #value.append(v['pubExtent'])
    #data.append(value)

  if 'pubPeriod' in v:
    value.append("공표주기")
    value.append(v['pubPeriod'])
    data.append(value)

  if 'writingTel' in v:
    value.append("연락처")
    value.append(v['writingTel'])
    data.append(value)

  if 'statsField' in v:
    value.append("통계(활용)분야·실태")
    value.append(v['statsField'])
    data.append(value)
  if 'examinObjrange' in v:
    value.append("조사대상범위")
    value.append(v['examinObjrange'])
    data.append(value)

  if 'examinObjArea' in v:
    value.append("조사대상지역")
    value.append(v['examinObjArea'])
    data.append(value)

  if 'josaUnit' in v:
    value.append("조사단위및조사대상규모")
    value.append(v['josaUnit'])
    data.append(value)

  if 'applyGroup' in v:
    value.append("적용분류")
    value.append(v['applyGroup'])
    data.append(value)

  if 'josaItm' in v:
    value.append("조사항목")
    value.append(v['josaItm'])
    data.append(value)













  if 'pubExtent' in v:
    value.append("공표범위")
    value.append(v['pubExtent'])
    data.append(value)

  if 'publictMth' in v:
    value.append("공표방법및URL")
    value.append(v['publictMth'])
    data.append(value)

  if 'examinTrgetPd' in v:
    value.append("조사대상기간및조사기준시점")
    value.append(v['examinTrgetPd'])
    data.append(value)

  if 'dataUserNote' in v:
    value.append("자료이용자유의사항")
    value.append(v['dataUserNote'])
    data.append(value)

  if 'mainTermExpl' in v:
    value.append("주요용어해설")
    value.append(v['mainTermExpl'])
    data.append(value)
  if 'dataCollectMth' in v:
    value.append("자료수집방법")
    value.append(v['dataCollectMth'])
    data.append(value)

  if 'examinHistory' in v:
    value.append("조사연혁")
    value.append(v['examinHistory'])
    data.append(value)

  if 'confmNo' in v:
    value.append("승인번호")
    value.append(v['confmNo'])
    data.append(value)

  if 'confmDt' in v:
    value.append("승인일자")
    value.append(v['confmDt'])
    data.append(value)

  if 'statsEnd' in v:
    value.append("통계종료")
    value.append(v['statsEnd'])
    data.append(value)

#데이터개수
count = len(data)













class MyWindow(QMainWindow):
  def __init__(self):
    super().__init__()
    self.setupUI()

  def setupUI(self):
    self.setGeometry(800, 200, 600, 600)
    self.tableWidget = QTableWidget(self)
    self.tableWidget.resize(600, 600)
    self.tableWidget.setRowCount(count)
    self.tableWidget.setColumnCount(2)
    self.tableWidget.setColumnWidth(1, 450)
    self.setTableWidgetData()
    self.tableWidget.resizeRowsToContents()



  def setTableWidgetData(self):
    column_headers = ['항목', '설명']
    self.tableWidget.setHorizontalHeaderLabels(column_headers)

    for i in range(count):
       str_data = str(data[i])
       item = str_data.replace("'", "").replace("[", "").replace("]", "")
       total_count = len(item.split(","))
       #항목
       title = item.split(",")[0]
       #설명
       content = ""
       for j in range(1, total_count):
         content += item.split(",")[j]

       self.tableWidget.setItem(0, i*2, QTableWidgetItem(title))
       self.tableWidget.setItem(0, (i*2)+1, QTableWidgetItem(content))

if __name__ == "__main__":
  app = QApplication(sys.argv)
  mywindow = MyWindow()
  mywindow.show()
  app.exec_()
























  2.4.3.2 XML
```

<!-- page: 123 -->
- 호출 URL: `http://kosis.kr/openApi/StatsExplain.domethod=getList`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
statId

* orgId(기관ID) String 통계조사 ID 필수
+tblId(통계표ID) 로도 가능
필수

전체 - All
조사명-statsNm
작성유형-statsKind
통계종류-statsEnd
계속여부-statsContinue

법적근거-basisLaw
조사목적-writingPurps
조사기간-examinPd
조사주기-statsPeriod
조사체계-writingSystem
연락처-writingTel

통계(활용)분야·실태-statsField
조사 대상범위-examinObjrange
metaItm String 요청 항목 조사 대상지역-examinObjArea
조사단위 및 조사대상규모-josaUnit
적용분류-applyGroup

조사항목-josaItm
공표주기-pubPeriod
공표범위-pubExtent
공표시기-pubDate
공표방법 및 URL-publictMth
조사대상기간 및 조사기준시점-examinTrgetPd

자료이용시 유의사항 -dataUserNote
주요 용어해설-mainTermExpl
자료 수집방법-dataCollectMth
조사연혁-examinHistory
승인번호-confmNo

승인일자-confmDt
format String 결과유형(JSON, SDMX) 필수

<!-- page: 124 -->

- 출력 변수
항목명(영문) 항목설명 형식

statsNm 조사명 VARCHAR2(4000)
statsKind 작성유형 VARCHAR2(4000)
statsEnd 통계종류 VARCHAR2(4000)

statsContinue 계속여부 VARCHAR2(4000)
basisLaw 법적근거 VARCHAR2(4000)
writingPurps 조사목적 VARCHAR2(4000)
examinPd 조사기간 VARCHAR2(4000)

statsPeriod 조사주기 VARCHAR2(4000)
writingSystem 조사체계 VARCHAR2(4000)
writingTel 연락처 VARCHAR2(8000)
statsField 통계(활용)분야·실태 VARCHAR2(4000)

examinObjrange 조사 대상범위 VARCHAR2(4000)
examinObjArea 조사 대상지역 VARCHAR2(4000)
josaUnit 조사단위 및 조사대상규모 VARCHAR2(4000)
applyGroup 적용분류 VARCHAR2(4000)

josaItm 조사항목 VARCHAR2(4000)
pubPeriod 공표주기 VARCHAR2(4000)
pubExtent 공표범위 VARCHAR2(4000)

pubDate 공표시기 VARCHAR2(4000)
publictMth 공표방법 및 URL VARCHAR2(4000)
examinTrgetPd 조사대상기간 및 조사기준시점 VARCHAR2(4000)
dataUserNote 자료이용자 유의사항 VARCHAR2(4000)

mainTermExpl 주요 용어해설 VARCHAR2(4000)
dataCollectMth 자료 수집방법 VARCHAR2(4000)
examinHistory 조사연혁 VARCHAR2(4000)
confmNo 승인번호 VARCHAR2(4000)

confmDt 승인일자 VARCHAR2(4000)

<!-- page: 125 -->

- 예제 소스 결과

### 예제 소스 (JSP)

```jsp
<!--
 KOSIS OpenAPI를 이용하여 통계설명자료를 출력하는 예제입니다.
 이 소스는 KOSIS API를 사용하는데 참고가 되도록 제공하는 것으로
 사용자의 운영환경에 따라 수정작업이 필요합니다

 * 유의사항 : Ajax를 활용하여 개발을 진행하실 때에는 CrossDomain으로 인한
   통신문제가 발생 할 수 있습니다.
   JSON 방식으로 제공받으실 때에는 개발홈페이지에 임의의 jsp를 생성하여
   호출함으로써 CrossDomain에 대한 제약을 우회하실 수 있는 개발소스를 제공합니다.
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml
1-transitional.dtd">
<%@ page contentType="text/html; charset=utf-8" %>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>통계청 - 공유서비스</title>

<link type="text/css" rel="stylesheet" media="all" href="https://mgmk.kosis.kr/openapi_dev/ext/style/subCommon.
css" />

<script type="text/javascript" language="JavaScript" src="https://mgmk.kosis.kr/openapi_dev/ext/script/jquery-1.
6.1.min.js"></script>
<script type="text/javascript" language="JavaScript">

var mapData;

// window onload 되었을때 실행 함수
$(document).ready(function(){

// 통계설명자료를 조회하기위해 함수를 호출한다.
getSubList("ALL", "1962009");
});

/****************************************************
* 통계목록 리스트 조회 함수
* parameter : metaItm - 요청 항목












* statId - 통계조사 Id
****************************************************/
function getSubList(metaItm, statId) {

// ajax 통신을 위한 호출 함수
$.ajax({
type: "GET",
url: "http://mgmk.kosis.kr/openapi_dev/Expt/statisticsExplData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1Yzdh
ZTMwOWRjNjgxN2MzNDgwNmY=&metaItm=" + metaItm + "&statId=" + statId + "&format=xml&version=v2_1",
data: "",
async : true,
dataType: "xml",
success:function(object)
{

// ajax 통신이 성공하였을 때 통계설명자료를 화면에 출력하기 위한 함수
var data = object.documentElement.childNodes[1].childNodes;

var nodeInfo="";

nodeInfo= "<table cellpadding='0' cellspacing='0' class='TB02' summary=''>";
nodeInfo+=" <thead>"
nodeInfo+=" <tr>"
nodeInfo+=" <th class='fst al_C' scope='col' style='width:20%;'>항목</th>"
nodeInfo+=" <th scope='col'>설명</th>"
nodeInfo+=" </tr>"
nodeInfo+=" </thead>"
nodeInfo+=" <tbody>"
for (var i = 0; i < data.length; i++) {
if (data[i].tagName == "statsNm") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사명</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "statsKind") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>작성유형</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "statsEnd") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>통계종류</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "statsContinue") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>계속여부</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"












}
if (data[i].tagName == "basisLaw") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>법적근거</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "writingPurps") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사목적</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "examinPd") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사기간</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "statsPeriod") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사주기</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "writingSystem") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사체계</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "writingTel") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>연락처</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "statsField") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>통계(활용)분야·실태</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "examinObjrange") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사대상범위</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "examinObjArea") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사대상지역</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"











nodeInfo+=" </tr>"
}
if (data[i].tagName == "josaUnit") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사단위및조사대상규모</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "applyGroup") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>적용분류</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "josaItm") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사항목</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "pubPeriod") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>공표주기</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "pubExtent") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>공표범위</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "pubDate") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>공표시기</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "publictMth") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>공표방법및URL</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "examinTrgetPd") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사대상기간및조사기준시점</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "dataUserNote") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>자료이용자유의사항</td>"











nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "mainTermExpl") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>주요용어해설</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "dataCollectMth") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>자료수집방법</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "examinHistory") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>조사연혁</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "confmNo") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>승인번호</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
if (data[i].tagName == "confmDt") {
nodeInfo+=" <tr>"
nodeInfo+=" <td class='fst al_C' scope='row'>승인일자</td>"
nodeInfo+=" <td class='al_C'>"+data[i].childNodes[0].data+"</td>"
nodeInfo+=" </tr>"
}
}
nodeInfo+=" </tbody>"
nodeInfo+="</table>"

var r_node = document.getElementById("content");
r_node.innerHTML =nodeInfo;
},
error: function(xhr,status,error){
alert("error = " + error);
}
});
}
</script>
</head>
<body>
<div id="content" ></div>
</body>
</html>
```

<!-- page: 129 -->
### 예제 소스 (R)

```r
library(rvest) # api의 자료를 xml, html로 받은 경우
library(XML) # API에서 XML데이터 수집
library(RCurl)
library(tidyverse)
library(xml2)

all_items <- data.frame(
 ename = c(
  'statsNm',
  'statsKind',
  'statsEnd',
  'statsContinue',
  'basisLaw',
  'writingPurps',
  'examinPd',
  'statsPeriod',
  'writingSystem',
  'writingTel',
  'statsField',
  'examinObjrange',
  'examinObjArea',
  'josaUnit',
  'applyGroup',
  'josaItm',
  'pubPeriod',
  'pubExtent',
  'pubDate',
  'publictMth',
  'examinTrgetPd',
  'dataUserNote',
  'mainTermExpl',
  'dataCollectMth',
  'examinHistory',
  'confmNo',
  'confmDt'
 ),
 hname = c(
  '조사명',
  '작성유형',
  '통계종류',
  '계속여부',
  '법적근거',
  '조사목적',
  '조사주기',
  '조사체계',
  '공표범위',
  '공표주기',
  '연락처',
  '통계(활용)분야·실태',
  '조사 대상범위',
  '조사 대상지역',
  '조사단위 및 조사대상규모',
  '적용분류',











  '조사항목',
  '공표주기',
  '공표범위',
  '공표시기',
  '공표방법 및 URL',
  '조사대상기간 및 조사기준시점',
  '자료이용자 유의사항',
  '주요 용어해설',
  '자료 수집방법',
  '조사연혁',
  '승인번호',
  '승인일자'
 )
)


# 환경변수에 사용자 key 정의 (환경변수 편집 usethis::edit_r_environ() )
# KOSIS_TOKEN = ZjZjOTI3MjRjNmU1YzdhZTMwOWRjNjgxN2MzNDgwNmY=
v_apiKey = Sys.getenv('KOSIS_TOKEN')
baseurl <- 'https://kosis.kr/openapi/statisticsExplData.do?'

requestURL <- paste0(
 baseurl,
 "method=getList",
 "&format=xml",
 "&apiKey=" ,
 v_apiKey %>% I(),
 "&statId=" ,
 '1962009',
 "&metaItm=",
 'ALL'
)
raw_xml <- read_xml(requestURL)

xml_nodeSet <- xml_find_all(raw_xml, "//Structures")

df_lists <- data.frame()

for (i in 1:xml_length(xml_nodeSet[1])) {
 j <- xml_length(xml_nodeSet[1]) - i + 1

 v_desc <- xml_child(xml_nodeSet[[1]], j) %>% xml_text()
 v_name <- xml_child(xml_nodeSet[[1]], j) %>% xml_name()

 all_items %>% filter(ename == v_name) %>% select(hname) -> i_hname

 df_lists <- rbind(df_lists, c(item = i_hname, desc = v_desc))

}

colnames(df_lists) <- c("항목", "내용")
View(df_lists)
```

<!-- page: 132 -->
### 예제 소스 (Python)

```python
import sys
import requests
from bs4 import BeautifulSoup
from PyQt5.QtWidgets import *


open_url = 'http://kosis.kr/openapi/statisticsExplData.do?method=getList&apiKey=ZjZjOTI3MjRjNmU1YzdhZTMwOW
RjNjgxN2MzNDgwNmY=&format=xml&statId=1962009&metaItm=All&version=v2_1'

res = requests.get(open_url)
soup = BeautifulSoup(res.content, 'html.parser')

#변수 지정 및 데이터 저장
data = []
count = 0

if soup.find('statsnm') is not None:
  value = []
  value.append("조사명")
  value.append(soup.find('statsnm').text)
  data.append(value)
  count += 1

if soup.find('statskind') is not None:
  value = []
  value.append("작성유형")
  value.append(soup.find('statskind').text)
  data.append(value)
  count += 1

if soup.find('statsEnd') is not None:
  value = []
  value.append("통계종류")
  value.append(soup.find('statsEnd').text)
  data.append(value)
  count += 1
if soup.find('statscontinue') is not None:
  value = []
  value.append("계속여부")
  value.append(soup.find('statscontinue').text)
  data.append(value)
  count += 1

if soup.find('basislaw') is not None:
  value = []
  value.append("법적근거")
  value.append(soup.find('basislaw').text)
  data.append(value)
  count += 1














if soup.find('writingpurps') is not None:
  value = []
  value.append("조사목적")
  value.append(soup.find('writingpurps').text)
  data.append(value)
  count += 1

if soup.find('examinPd') is not None:
  value = []
  value.append("조사기간")
  value.append(soup.find('examinPd').text)
  data.append(value)
  count += 1

if soup.find('statsperiod') is not None:
  value = []
  value.append("조사주기")
  value.append(soup.find('statsperiod').text)
  data.append(value)
  count += 1

if soup.find('writingsystem') is not None:
  value = []
  value.append("조사체계")
  value.append(soup.find('writingsystem').text)
  data.append(value)
  count += 1
if soup.find('writingtel') is not None:
  value = []
  value.append("연락처")
  value.append(soup.find('writingtel').text)
  data.append(value)
  count += 1

if soup.find('statsfield') is not None:
  value = []
  value.append("통계(활용)분야·실태")
  value.append(soup.find('statsfield').text)
  data.append(value)
  count += 1

if soup.find('examinobjrange') is not None:
  value = []
  value.append("조사대상범위")
  value.append(soup.find('examinobjrange').text)
  data.append(value)
  count += 1

if soup.find('examinobjArea') is not None:
  value = []
  value.append("조사대상지역")
  value.append(soup.find('examinobjArea').text)












  data.append(value)
  count += 1

if soup.find('josaunit') is not None:
  value = []
  value.append("조사단위및조사대상규모")
  value.append(soup.find('josaunit').text)
  data.append(value)
  count += 1

if soup.find('applygroup') is not None:
  value = []
  value.append("적용분류")
  value.append(soup.find('applygroup').text)
  data.append(value)
  count += 1

if soup.find('josaitm') is not None:
  value = []
  value.append("조사항목")
  value.append(soup.find('josaitm').text)
  data.append(value)
  count += 1
if soup.find('pubperiod') is not None:
  value = []
  value.append("공표주기")
  value.append(soup.find('pubperiod').text)
  data.append(value)
  count += 1

if soup.find('pubExtent') is not None:
  value = []
  value.append("공표범위")
  value.append(soup.find('pubExtent').text)
  data.append(value)
  count += 1

if soup.find('pubDate') is not None:
  value = []
  value.append("공표시기")
  value.append(soup.find('pubDate').text)
  data.append(value)
  count += 1

if soup.find('publictmth') is not None:
  value = []
  value.append("공표방법및URL")
  value.append(soup.find('publictmth').text)
  data.append(value)
  count += 1

if soup.find('examintrgetpd') is not None:












  value = []
  value.append("조사대상기간및조사기준시점")
  value.append(soup.find('examintrgetpd').text)
  data.append(value)
  count += 1

if soup.find('datausernote') is not None:
  value = []
  value.append("자료이용자유의사항")
  value.append(soup.find('datausernote').text)
  data.append(value)
  count += 1

if soup.find('maintermexpl') is not None:
  value = []
  value.append("주요용어해설")
  value.append(soup.find('maintermexpl').text)
  data.append(value)
  count += 1

if soup.find('datacollectmth') is not None:
  value = []
  value.append("자료수집방법")
  value.append(soup.find('datacollectmth').text)
  data.append(value)
  count += 1
if soup.find('examinhistory') is not None:
  value = []
  value.append("조사연혁")
  value.append(soup.find('examinhistory').text)
  data.append(value)
  count += 1

if soup.find('confmno') is not None:
  value = []
  value.append("승인번호")
  value.append(soup.find('confmno').text)
  data.append(value)
  count += 1

if soup.find('confmdt') is not None:
  value = []
  value.append("승인일자")
  value.append(soup.find('confmdt').text)
  data.append(value)
  count += 1


class MyWindow(QMainWindow):

  def __init__(self):
    super().__init__()












    self.setupUI()

  def setupUI(self):
    self.setGeometry(800, 200, 600, 600)
    self.tableWidget = QTableWidget(self)
    self.tableWidget.resize(600, 600)
    self.tableWidget.setRowCount(count)
    self.tableWidget.setColumnCount(2)
    self.tableWidget.setColumnWidth(1, 450)
    self.setTableWidgetData()
    self.tableWidget.resizeRowsToContents()
    #window title 설정
    self.setWindowTitle(soup.find('structures').find('statsnm').text)


  def setTableWidgetData(self):
    column_headers = ['항목', '설명']
    self.tableWidget.setHorizontalHeaderLabels(column_headers)

    for i in range(count):
       str_data = str(data[i])
       item = str_data.replace("'", "").replace("[", "").replace("]", "")
       total_count = len(item.split(","))
       title = item.split(",")[0]
       content = ""
       for j in range(1, total_count):
         content += item.split(",")[j]
       self.tableWidget.setItem(0, i * 2, QTableWidgetItem(title))
       self.tableWidget.setItem(0, (i * 2) + 1, QTableWidgetItem(content))


if __name__ == "__main__":
  app = QApplication(sys.argv)
  mywindow = MyWindow()
  mywindow.show()
  app.exec_()
```

<!-- page: 137 -->
### 2.5 메타자료

- 통계자료에 대한 메타자료 제공을 위한 OpenAPI입니다.

2.
### 5.1 특징

- 자료 제공형태: XML, JSON

2.
### 5.2 서비스 활용

2.
5.
### 2.1 URL생성

- 개발가이드 > 통계표 설명> URL생성
‘작성기관’, ‘통계조사명’, ‘통계표명’ 등 을 입력하여 사용하고자 하는 자료를 조회한 뒤 조회결과에
서 생성할 통계표 ①선택하고, ②통계표 설명 분류선택, ③세부정보 입력하여 ④URL생성 버튼을
을 누르면 결과 값을 제공받을 수 있는 URL이 생성됩니다.
⑤통계표조회 버튼을 클릭하면 해당 자료의 통계표를 볼 수 있습니다.

<!-- page: 138 -->

2.
### 5.2 활용방법

2.
5.
### 2.1 JSON (통계표 명칭)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=TBL`
- 입력 변수

항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수
tblId String 통계표 ID 필수

format String 결과유형(JSON, SDMX) 필수
content String 헤더 유형(html, json) 선택

- 출력 변수
항목명(영문) 항목설명 형식

TBL_NM 통계표 국문명 VARCHAR2(300)
TBL_NM_ENG 통계표 영문명 VARCHAR2(300)

2.
5.
### 2.2 JSON (기관 명칭)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=ORG`
- 입력 변수

항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수

format String 결과유형(JSON, SDMX) 필수
content String 헤더 유형(html, json) 선택

- 출력 변수

항목명(영문) 항목설명 형식

ORG_NM 기관 국문명 VARCHAR2(300)
TORG_NM_ENG 기관 영문명 VARCHAR2(300)

<!-- page: 139 -->

2.
5.
### 2.3 JSON (수록정보)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=PRD`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수
tblId String 통계표ID 필수
format String 결과유형(JSON, SDMX) 필수
detail String 전체시점 정보 제공 선택
content String 헤더 유형(html, json) 선택

- 출력 변수

항목명(영문) 항목설명 형식
PRD_SE 수록주기 VARCHAR2(300)
PRD_DE 수록시점 VARCHAR2(8)

2.
5.
### 2.4 JSON (분류/항목)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=ITM`
- 입력 변수

항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수

orgId String 기관 코드 필수
tblId String 통계표ID 필수
objId String 분류코드 선택
itmId String 자료코드 선택

format String 결과유형(json, xml) 필수
content String 헤더 유형(html, json) 선택

- 출력 변수
항목명(영문) 항목설명 형식

OBJ_ID 분류 ID VARCHAR2(40)
OBJ_NM 분류 국문명 VARCHAR2(3000)
OBJ_NM_ENG 분류 영문명 VARCHAR2(3000)
ITM_ID 자료코드 ID VARCHAR2(40)

ITM_NM 자료코드 국문명 VARCHAR2(3000)
ITM_NM_ENG 자료코드 영문명 VARCHAR2(3000)
UP_ITM_ID 상위 자료코드 VARCHAR2(40)
OBJ_ID_SN 분류값 순번 NUMBER(3)

UNIT_ID 단위ID VARCHAR2(40)
UNIT_NM 단위 국문명 VARCHAR2(1000)
UNIT_ENG_NM 단위 영문명 VARCHAR2(1000)

<!-- page: 140 -->

2.
5.
### 2.5 JSON (주석)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=CMMT`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수
tblId String 통계표ID 필수
format String 결과유형(JSON, SDMX) 필수

content String 헤더 유형(html, json) 선택

- 출력 변수

항목명(영문) 항목설명 형식
CMMT_NM 주석유형 VARCHAR2(40)
CMMT_DC 주석 VARCHAR2(3000)

OBJ_ID 분류 ID VARCHAR2(40)
OBJ_NM 분류 명 VARCHAR2(3000)
ITM_ID 자료코드 ID VARCHAR2(40)

ITM_NM 자료코드 명 VARCHAR2(3000)

2.
5.
### 2.6 JSON (단위)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=UNIT`
- 입력 변수

항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수

orgId String 기관코드 필수
tblId String 통계표ID 필수
format String 결과유형(JSON, SDMX) 필수

content String 헤더 유형(html, json) 선택

- 출력 변수

항목명(영문) 항목설명 형식
UNIT_NM 단위 국문명 VARCHAR2(1000)

UNIT_NM_ENG 단위 영문명 VARCHAR2(1000)

<!-- page: 141 -->

2.
5.
### 2.7 JSON (출처)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=SOURCE`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수

tblId String 통계표ID 필수
format String 결과유형(json, xml) 필수

content String 헤더 유형(html, json) 선택

- 출력 변수

항목명(영문) 항목설명 형식

JOSA_NM 조사명 VARCHAR2(300)
DEPT_NM 통계표 담당부서 VARCHAR2(300)

DEPT_PHONE 단위 담당부서 전화번호 VARCHAR2(100)
STAT_ID 통계조사ID VARCHAR2(40)

2.
5.
### 2.8 JSON (가중치)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=WGT`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수
tblId String 통계표ID 필수

분류코드1~분류코드8 String 분류코드1~분류코드8 선택
ITEM String 항목 선택
format String 결과유형(json, xml) 필수
content String 헤더 유형(html, json) 선택

- 출력 변수

항목명(영문) 항목설명 형식
C1 ~ C8 분류값 ID1 ~ 분류값 ID8 VARCHAR2(40)
C1_NM ~ C8_NM 분류값 명1 ~ 분류값 명8 VARCHAR2(3000)

ITM_ID 항목 ID VARCHAR2(40)
ITM_NM 항목명 VARCHAR2(3000)
WGT_CO 가중치 NUMBER(23,10)

<!-- page: 142 -->

2.
5.
### 2.9 JSON (자료갱신일)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=NCD`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수
tblId String 통계표ID 필수
prdSe String 수록주기 선택

format String 결과유형(json, xml) 필수
content String 헤더 유형(html, json) 선택

- 출력 변수
항목명(영문) 항목설명 형식

ORG_NM 기관명 VARCHAR2(300)
TBL_NM 통계표명 VARCHAR2(300)
PRD_SE 수록주기 VARCHAR2(300)
PRD_DE 수록시점 VARCHAR2(8)

SEND_DE 자료갱신일 VARCHAR2(20)

2.
5.
### 2.10 XML (통계표 명칭)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=TBL`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수

tblId String 통계표ID 필수
format String 결과유형(JSON, SDMX) 필수

- 출력 변수

항목명(영문) 항목설명 형식

tblNm 통계표 국문명 VARCHAR2(300)
tblNmEng 통계표 영문명 VARCHAR2(300)

<!-- page: 143 -->

2.
5.
### 2.11 XML (기관 명칭)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=ORG`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수

format String 결과유형(JSON, SDMX) 필수

- 출력 변수

항목명(영문) 항목설명 형식
orgNm 기관 국문명 VARCHAR2(300)

orgNmEng 기관 영문명 VARCHAR2(300)

2.
5.
### 2.12 XML (수록정보)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=PRD`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수
tblId String 통계표ID 필수
format String 결과유형(JSON, SDMX) 필수

detail String 전체시점 정보 제공 선택

- 출력 변수

항목명(영문) 항목설명 형식
prdSe 수록주기 VARCHAR2(300)

PrdDe 수록시점 VARCHAR2(8)

<!-- page: 144 -->

2.
5.
### 2.13 XML (분류/항목)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=ITM`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수
tblId String 통계표ID 필수
objId String 분류코드 선택
itmId String 자료코드 선택
format String 결과유형(JSON, SDMX) 필수

- 출력 변수
항목명(영문) 항목설명 형식

objId 분류 ID VARCHAR2(40)
objNm 분류 국문명 VARCHAR2(3000)
objNmEng 분류 영문명 VARCHAR2(3000)

itmId 자료코드 ID VARCHAR2(40)
itmNm 자료코드 국문명 VARCHAR2(3000)
itmNmEng 자료코드 영문명 VARCHAR2(3000)
upItmId 상위 자료코드 VARCHAR2(40)

objIdSn 분류값 순번 NUMBER(3)
unitId 단위ID VARCHAR2(40)
unitNm 단위 국문명 VARCHAR2(1000)
unitEngNm 단위 영문명 VARCHAR2(1000)

2.
5.
### 2.14 XML (주석)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=CMMT`
- 입력 변수

항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수
tblId String 통계표ID 필수

format String 결과유형(JSON, SDMX) 필수

- 출력 변수

항목명(영문) 항목설명 형식
CMMT_NM 주석유형 VARCHAR2(40)
CMMT_DC 주석 VARCHAR2(3000)
OBJ_ID 분류 ID VARCHAR2(40)
OBJ_NM 분류 명 VARCHAR2(3000)
ITM_ID 자료코드 ID VARCHAR2(40)
ITM_NM 자료코드 명 VARCHAR2(3000)

<!-- page: 145 -->

2.
5.
### 2.15 XML (단위)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=UNIT`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
unitId String 단위코드 필수
format String 결과유형(JSON, SDMX) 필수

- 출력 변수

항목명(영문) 항목설명 형식
unitNm 단위 국문명 VARCHAR2(1000)
unitNmEng 단위 영문명 VARCHAR2(1000)

2.
5.
### 2.16 XML (출처)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=SOURCE`
- 입력 변수

항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수

orgId String 기관 ID 필수
tblId String 통계표ID 필수
format String 결과유형(JSON, SDMX) 필수

- 출력 변수

항목명(영문) 항목설명 형식
josaNm 조사명 VARCHAR2(300)
deptNm 통계표 담당부서 VARCHAR2(300)

deptPhone 통계표 담당부서 전화번호 VARCHAR2(100)
statId 통계조사 ID VARCHAR2(40)

<!-- page: 146 -->

2.
5.
### 2.17 XML (가중치)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=WGT`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수
tblId String 통계표ID 필수
분류코드1~분류코드8 String 분류코드1~분류코드8 선택

ITEM String 항목 선택
format String 결과유형(JSON, SDMX) 필수

- 출력 변수
항목명(영문) 항목설명 형식

C1 ~ C8 분류값 ID1 ~ 분류값 ID8 VARCHAR2(40)
C1_NM ~ C8_NM 분류값 명1 ~ 분류값 명8 VARCHAR2(3000)
ITM_ID 항목 ID VARCHAR2(40)
ITM_NM 항목명 VARCHAR2(3000)

WGT_CO 가중치 NUMBER(23,10)

2.
5.
### 2.18 XML (자료갱신일)

- 호출 URL: `http://kosis.kr/openapi/statisticsData.do?method=getMeta&type=NCD`
- 입력 변수

항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
orgId String 기관 ID 필수

tblId String 통계표ID 필수
prdSe String 수록주기 선택

format String 결과유형(json, xml) 필수

- 출력 변수

항목명(영문) 항목설명 형식

orgNm 기관명 VARCHAR2(300)
tblNm 통계표명 VARCHAR2(300)

prdSe 수록주기 VARCHAR2(300)
prdDe 수록시점 VARCHAR2(8)

sendDe 자료갱신일 VARCHAR2(20)

<!-- page: 147 -->

### 2.6 KOSIS통합검색

- 국가통계포털(www.kosis.kr)의 통합검색결과 제공을 위한 OpenAPI입니다.

2.
### 6.1 특징

- 자료 제공형태: JSON

2.
### 6.2 서비스 활용

2.
6.
### 2.1 URL생성

- 개발가이드 > KOSIS 통합검색 > URL생성
‘검색어’, ‘정렬’, ‘페이지번호’ 등 을 입력한 뒤 ‘URL복사’, ’결과값보기’ 중 원하는 서비스에 해당하
는 버튼을 누르면 결과값을 제공받을 수 있습니다.

<!-- page: 148 -->

2.
### 6.2 활용방법

2.
6.
### 2.1 JSON

- 호출 URL: `http://kosis.kr/openapi/statisticsSearch.do?method=getList`
- 입력 변수

항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수
searchNm String 검색명 필수
정렬
선택
비고 : 정확도 RANK, 최신순 DATE
sort String
※ 호출 파라미터에 sort 없을 경우에는
자동으로 RANK 로 정렬
startCount String 페이지 번호 선택
데이터 출력 개수 선택
비고 : resultCount=20, startCount=1 :
resultCount String 1~20번 결과 리턴
resultCount=20, startCount=2 :
21~40번 결과 리턴

format String 결과유형(json) 필수
content String 헤더 유형(html, json) 선택

- 출력 변수

항목명(영문) 항목설명 형식
ORG_ID 기관코드 VARCHAR2(40)
ORG_NM 기관명 VARCHAR2(300)

TBL_ID 통계표ID VARCHAR2(40)
TBL_NM 통계표명 VARCHAR2(300)
STAT_ID 조사코드 VARCHAR2(40)
STAT_NM 조사명 VARCHAR2(400)

VW_CD KOSIS 목록구분 VARCHAR2(40)
MT_ATITLE KOSIS 통계표 위치 VARCHAR2(4000)
FULL_PATH_ID 통계표 위치 VARCHAR2(400)
CONTENTS 통계표 주요내용 CLOB

STRT_PRD_DE 수록기간 시작일 VARCHAR2(20)
END_PRD_DE 수록기간 종료일 VARCHAR2(20)
ITEM03 통계표 주석 CLOB

REC_TBL_SE 추천통계표 여부 VARCHAR2(10)
TBL_VIEW_URL 통계표 이동URL (KOSIS 목록으로 이동) VARCHAR2(4000)
LINK_URL 통계표 이동URL (KOSIS 통계표로 이동) VARCHAR2(4000)
STAT_DB_CNT 검색결과 건수 VARCHAR2(4000)

QUERY 검색어명 VARCHAR2(4000)

<!-- page: 149 -->

### 2.7 통계주요지표

- 지표 Open API 서비스를 이용하기 위한 JSON, XML 기반의 데이터형식, 요청변수, 반환되는 코

드값을 제공합니다.

2.
### 7.1 특징

- 자료 제공형태: XML, JSON
2.
### 7.2 서비스 활용

2.
7.
### 2.1 URL생성

- 개발가이드 > 통계주요지표 > URL생성
‘서비스선택’, ‘상세기능선택’을 선택한 뒤 ‘URL생성’, ’URL복사’ 중 원하는 서비스에 해당하는 버튼
을 누르면 결과값을 제공받을 수 있습니다.

<!-- page: 150 -->

2.
### 7.2 활용방법

2.
7.
### 2.1 JSON, XML (지표 고유번호별 설명자료조회)

- 호출 URL :
http://kosis.kr/openapi/pkNumberService.do?method=getList&service=1&serviceDetail=pkAll
- 입력 변수

항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수
jipyoId String 지표 ID 필수

pageNo String 페이지 번호 선택
데이터 출력 개수 선택
비고 : numOfRows=20, pageNo=1 :
1~20번 결과 리턴
numOfRows=20, pageNo=2 :
numOfRows String
21~40번 결과 리턴
※ 호출 파라미터에 pageNo, numOfRows
없을경우에는 자동으로 pageNo=1,
numOfRows=10으로 결과 리턴
format String 결과유형(json, xml) 필수

content String 헤더 유형(html, json) 선택

- 출력 변수
항목명(영문) 항목설명 형식

statJipyoId 지표ID NUMBER(20)

statJipyoNm 지표명 VARCHAR2(300)
jipyoExplan 설명자료 제목 VARCHAR2(100)

jipyoExplan1 개념 CLOB

<!-- page: 151 -->

2.
7.
### 2.2 JSON, XML (지표명별 설명자료조회)

- 호출 URL :
http://kosis.kr/openapi/indExpService.do?method=getList&service=2&serviceDetail=indAll
- 입력 변수

항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
jipyoNm String 지표명 필수

pageNo String 페이지 번호 선택
데이터 출력 개수 선택
비고 : numOfRows=20, pageNo=1 :

1~20번 결과 리턴
numOfRows=20, pageNo=2 :
numOfRows String
21~40번 결과 리턴
※ 호출 파라미터에 pageNo, numOfRows
없을경우에는 자동으로 pageNo=1,
numOfRows=10으로 결과 리턴
format String 결과유형(json, xml) 필수
content String 헤더 유형(html, json) 선택

- 출력 변수
항목명(영문) 항목설명 형식

statJipyoId 지표ID NUMBER(20)
statJipyoNm 지표명 VARCHAR2(300)

jipyoExplan 설명자료 제목 VARCHAR2(100)
jipyoExplan1 개념 CLOB

<!-- page: 152 -->

2.
7.
### 2.3 JSON, XML (목록별 지표조회)

- 호출 URL: `http://kosis.kr/openapi/indiListService.do?method=getList&service=3`

- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
listId String 목록ID 필수
pageNo String 페이지 번호 선택
데이터 출력 개수 선택

비고 : numOfRows=20, pageNo=1 :
1~20번 결과 리턴
numOfRows=20, pageNo=2 :
numOfRows String
21~40번 결과 리턴
※ 호출 파라미터에 pageNo, numOfRows
없을경우에는 자동으로 pageNo=1,
numOfRows=10으로 결과 리턴
format String 결과유형(json, xml) 필수
content String 헤더 유형(html, json) 선택

- 출력 변수

항목명(영문) 항목설명 형식

listId 세부목록ID VARCHAR2(40)
listNm 세부부문명 VARCHAR2(300)

statJipyoId 지표ID NUMBER(20)
statJipyoNm 지표명 VARCHAR2(300)
unit 단위 VARCHAR2(200)

areaTypeName 지역구분명 VARCHAR2(10)
prdSeName 수록주기명 VARCHAR2(10)

strtPrdDe 수록시작시점 VARCHAR2(8)
endPrdDe 수록종료시점 VARCHAR2(8)

rn 수록시점개수 NUMBER(5)
listSn1 목록순서1 NUMBER(22)

listSn2 목록순서2 NUMBER(22)
prdDe 시점 VARCHAR2(100)

repJipyoId 대표지표ID NUMBER(20)
repJipyoNm 대표지표명 VARCHAR2(300)

repJipyoUrl 대표지표URL VARCHAR2(3000)
explainUrl 지표설명URL VARCHAR2(3000)

<!-- page: 153 -->

2.
7.
### 2.4 JSON, XML (지표명별 목록조회)

- 호출 URL :
http://kosis.kr/openapi/indListSearchRequest.do?method=getList&service=4&serviceDetail=indList
- 입력 변수

항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
jipyoNm String 지표명 필수

pageNo String 페이지 번호 선택
데이터 출력 개수 선택
비고 : numOfRows=20, pageNo=1 :

1~20번 결과 리턴
numOfRows=20, pageNo=2 :
numOfRows String
21~40번 결과 리턴
※ 호출 파라미터에 pageNo, numOfRows
없을경우에는 자동으로 pageNo=1,
numOfRows=10으로 결과 리턴
format String 결과유형(json, xml) 필수
content String 헤더 유형(html, json) 선택

- 출력 변수
항목명(영문) 항목설명 형식

statJipyoId 지표ID NUMBER(20)
statJipyoNm 지표명 VARCHAR2(300)

unit 단위 VARCHAR2(200)
areaTypeName 지역구분명 VARCHAR2(10)

prdSeName 수록주기명 VARCHAR2(10)
strtPrdDe 수록시작시점 VARCHAR2(8)

endPrdDe 수록종료시점 VARCHAR2(8)
rn 수록시점개수 NUMBER(5)

prdDe 종료시점+주기명 VARCHAR2(100)

<!-- page: 154 -->

2.
7.
### 2.5 JSON,XML (고유번호별 목록조회)

- 호출 URL :
http://kosis.kr/openapi/indListSearchRequest.do?method=getList&service=4&serviceDetail=indList
- 입력 변수

항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
jipyoId String 지표ID 필수

pageNo String 페이지 번호 선택
데이터 출력 개수 선택
비고 : numOfRows=20, pageNo=1 :

1~20번 결과 리턴
numOfRows=20, pageNo=2 :
numOfRows String
21~40번 결과 리턴
※ 호출 파라미터에 pageNo, numOfRows
없을경우에는 자동으로 pageNo=1,
numOfRows=10으로 결과 리턴
format String 결과유형(json, xml) 필수
content String 헤더 유형(html, json) 선택

- 출력 변수
항목명(영문) 항목설명 형식

statJipyoId 지표ID NUMBER(20)
statJipyoNm 지표명 VARCHAR2(300)

unit 단위 VARCHAR2(200)
areaTypeName 지역구분명 VARCHAR2(10)

prdSeName 수록주기명 VARCHAR2(10)
strtPrdDe 수록시작시점 VARCHAR2(8)

endPrdDe 수록종료시점 VARCHAR2(8)
rn 수록시점개수 NUMBER(5)

prdDe 종료시점+주기명 VARCHAR2(100)

<!-- page: 155 -->

2.
7.
### 2.6 JSON,XML (고유번호별 지표 상세조회)

- 호출 URL: `http://kosis.kr/openapi/indIdDetailSearchRequest.do?method=getList&service=4`
&serviceDetail=indIdDetail
- 입력 변수

항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
jipyoId String 지표ID 필수

startPrdDe String 조회 시작 시점
선택
시점기준
endPrdDe String 조회 종료 시점
rn String 조회 기준 시점
선택
최신자료기준
srvRn String 조회 시점 개수
pageNo String 페이지 번호 선택
데이터 출력 개수 선택
비고 : numOfRows=20, pageNo=1 :
1~20번 결과 리턴
numOfRows=20, pageNo=2 :
numOfRows String
21~40번 결과 리턴
※ 호출 파라미터에 pageNo, numOfRows
없을경우에는 자동으로 pageNo=1,
numOfRows=10으로 결과 리턴
format String 결과유형(json, xml) 필수
content String 헤더 유형(html, json) 선택

- 출력 변수

항목명(영문) 항목설명 형식

statJipyoId 지표ID NUMBER(20)
statJipyoNm 지표명 VARCHAR2(300)

prdSe 수록주기 VARCHAR2(20)
prdDe 시점 VARCHAR2(8)

itmNm 항목 VARCHAR2(300)
val 통계수치 NUMBER(25,10)

<!-- page: 156 -->

2.
7.
### 2.7 JSON,XML (수록주기별 목록조회)

- 호출 URL :
http://kosis.kr/openapi/prListSearchRequest.do?method=getList&service=4&serviceDetail=prList
- 입력 변수
항목명(영문) 변수타입 항목설명 비고

apiKey String 발급된 인증키 필수
prdSe String 수록주기 필수

pageNo String 페이지 번호 선택
데이터 출력 개수 선택

비고 : numOfRows=20, pageNo=1 :
1~20번 결과 리턴
numOfRows=20, pageNo=2 :
numOfRows String
21~40번 결과 리턴
※ 호출 파라미터에 pageNo, numOfRows
없을경우에는 자동으로 pageNo=1,
numOfRows=10으로 결과 리턴
format String 결과유형(json, xml) 필수

content String 헤더 유형(html, json) 선택

- 출력 변수
항목명(영문) 항목설명 형식

statJipyoId 지표ID NUMBER(20)

statJipyoNm 지표명 VARCHAR2(300)
unit 단위 VARCHAR2(200)

areaTypeName 지역구분명 VARCHAR2(10)
prdSeName 수록주기명 VARCHAR2(10)

strtPrdDe 수록시작시점 VARCHAR2(8)
endPrdDe 수록종료시점 VARCHAR2(8)

rn 수록시점개수 NUMBER(5)
prdDe 종료시점+주기명 VARCHAR2(100)

<!-- page: 157 -->

2.
7.
### 2.8 JSON,XML (지표명별 상세조회)

- 호출 URL :`http://kosis.kr/openapi/indDetailSearchRequest.do?method=getList&service=4`
&serviceDetail=indDetail
- 입력 변수

항목명(영문) 변수타입 항목설명 비고
apiKey String 발급된 인증키 필수

jipyoNm String 지표명 필수
startPrdDe String 조회 시작 시점
선택
시점기준
endPrdDe String 조회 종료 시점
rn String 조회 기준 시점
선택
최신자료기준
srvRn String 조회 시점 개수
pageNo String 페이지 번호 선택
데이터 출력 개수 선택
비고 : numOfRows=20, pageNo=1 :
1~20번 결과 리턴
numOfRows=20, pageNo=2 :
numOfRows String
21~40번 결과 리턴
※ 호출 파라미터에 pageNo, numOfRows
없을경우에는 자동으로 pageNo=1,
numOfRows=10으로 결과 리턴
format String 결과유형(json, xml) 필수

content String 헤더 유형(html, json) 선택

- 출력 변수

항목명(영문) 항목설명 형식
statJipyoId 지표ID NUMBER(20)

statJipyoNm 지표명 VARCHAR2(300)
prdSe 수록주기 VARCHAR2(20)

prdDe 시점 VARCHAR2(8)
itmNm 항목 VARCHAR2(300)

val 통계수치 NUMBER(25,10)

<!-- page: 158 -->

## 참고: SDMX

KOSIS 공유서비스 자료 제공형태 중에서 SDMX는 XML의 일종으로서 통계에 특화된 XML로 보시면 됩니다.

SDMX는 Statistical Data and Metadata eXchange의 약어로 통계작성기구(기관)간의 다양한 형태의 통계
자료를 XML 기반으로 제공하여 교환과 공유를 효율적으로 지원합니다.

SDMX 표준은 국제결제은행(BIS), 유럽중앙은행, 유럽통계처(Eurostat), 국제통화기금(IMF), 경제협력개발기구
(OECD), UN 통계국 및 세계은행의 국제기구들로부터 후원을 받고 있습니다.

현재 Version 2.1은 2013년 1월에 ISO(국제표준화기구) 17369로 국제표준 인증을 받았으며 각 국의 통계청과
여러 국제기구에 이르기까지 사용범위가 점차 확대되고 있습니다.

SDMX 표준 및 지침, 개발도구(software), 새로운 소식 등은 현재 sdmx.org 웹사이트(링크)를 통해 제공되고
있습니다.

※ SDMX 파일에 대한 설명(SDMX Version 2.1)

구 분 설 명

Data Structure Definition의 약어로 통계자료에 대한 의미와 구조를 정의
통계표를 예를 들면 통계표에 대한 설명과 통계표의 형태를 파악할 수 있는 통
DSD
계표의 구성정보와 분류, 분류값, 단위, 항목에 대한 상세정보(코드 및 명칭)를 담
고 있음
DATA 파일은 DSD에서 정의한 구성정보에 주기, 시점에 따른 수치정보를 정의
SDMX version 2.1에서는 Generic, StructureSpecific 두 가지 포맷으로 나뉘어짐

- Generic: 데이터를 담는 XML 구성요소가 구조를 정의하는 메세지와 독립적인
형태로 이루어져 있으며 통계구성정보 및 수치정보가 각 Element(요소, 항
DATA 목)로 구성되어 있어 StructureSpecific에 비해 파일 용량이 큼
- StructureSpecific: 데이터를 담는 XML 구성요소는 구조를 정의하는 메세지에

의존적인 형태로 이루어져 있으며 통계구성정보 및 수치정보는 하나의
Element(요소, 항목)에 Attribute(속성)로 나열되어 있어 Generic에 비해 파일 용량이 작음
