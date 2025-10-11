## 목표
너는 지금부터 LLM 에이전트에 붙일 MCP (Model Context Protocol) Server를 만들어야 한다.
제시한 함수들을 구현해서 MCP 서버를 Typescript로 만들고, 테스트까지 수행하라.

목표는 병무청 병역일터에서 병역특례 업체 리스트 및 정보를 성공적으로 가져오는 것이다.

또한, 항상 Best practice를 기반으로 코드를 작성한다.
구현해야 할 Function은 다음과 같다.

### `search_designated_entities()`
```js
/**
 * @typedef {('산업기능요원'|'전문연구요원'|'승선근무예비역')} AgentTypeKeys
 * @typedef {('철강'|'기계'|'전기'|'전자'|'화학'|'섬유'|'신발'|'시멘요업'|'생활용품'|'통신기기'|'정보처리'|'게임SW'|'영상게임'|'의료의약'|'식음료'|'농산물가공'|'수산물가공'|'임산물가공'|'동물약품'|'애니메이션'|'석탄채굴'|'일반광물채굴'|'선광제련'|'에너지'|'국내건설'|'국외건설'|'내항화물'|'외항화물'|'내항선박관리'|'외항선박관리'|'근해'|'원양')} IndustryCodeKeys
 * @typedef {('대기업'|'중소기업'|'중견기업'|'농어민후계'|'기타')} CompanySizeCodeKeys
 * @typedef {('서울특별시'|'부산광역시'|'대구광역시'|'인천광역시'|'광주광역시'|'대전광역시'|'울산광역시'|'세종특별자치시'|'경기도'|'충청북도'|'충청남도'|'전라남도'|'경상북도'|'경상남도'|'제주특별자치도'|'강원특별자치도'|'전북특별자치도')} SidoAddrKeys
 */

/**
 * 병역일터 검색 조건을 정의하는 파라미터 객체.
 * 빈 값 ('')은 해당 조건에 대해 전체 조회를 의미합니다.
 *
 * @typedef {object} MilitaryWorkplaceSearchQuery
 * @property {IndustryCodeKeys[]} [al_eopjong_gbcd] - 업종 그룹 코드 (업종 선택 리스트와 일치). 빈 필드는 전체 조회를 의미.
 * @property {''} [al_eopjong_gbcd_yn] - 해당 필드는 Key만 선언하고 Value는 빈 문자열로 설정 (전체 조회용).
 * @property {IndustryCodeKeys[]} [eopjong_gbcd_list] - 업종 선택 목록.
 * @property {AgentTypeKeys} eopjong_gbcd - **(필수)** 복무 형태: '산업기능요원', '전문연구요원', '승선근무예비역' 중 하나.
 * @property {(''|CompanySizeCodeKeys)} [gegyumo_cd] - 기업 규모: '대기업', '중소기업', '중견기업', '농어민후계', '기타' 중 하나 또는 빈 값(전체 조회).
 * @property {IndustryCodeKeys} [eopjong_cd] - 업종 코드. API 요청 시 form-data 내에서 여러 개가 중복 선언될 수 있음.
 * @property {string} [eopche_nm] - 회사 이름. 빈 값은 전체 조회를 의미.
 * @property {SidoAddrKeys} [sido_addr] - 시/도 선택.
 * @property {string} [sigungu_addr] - 시/도 내의 시/군/구 주소. 빈 값은 해당 sido_addr 전체를 조회 함.
 * @property {(''|'Y')} [chaeyongym] - 병무청 채용 공고 등록 업체 여부. 'Y' 또는 빈 값(전체 조회).
 * @property {('H'|'B')} [bjinwonym] - 현역('H') 또는 보충역('B') TO 유무 지정. API 요청 시 둘 다 조회하려면 필드를 중복 선언해야 함.
 */
search_designated_entities(WorksiteSearchConditions): 
```

다음 TypeScript 코드로 의약품 코드를 기반으로 의약품의 상세정보를 가져온다.
아래 예제에서는 fetch를 사용하였지만, 현재 제시된 상황을 고려하여 올바른 HTTP Library를 결정할 수 있다.
```typescript
// HTTP 요청
fetch("https://work.mma.go.kr/caisBYIS/search/downloadBYJJEopCheExcel.do", {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "ko,en-US;q=0.9,en;q=0.8,ru;q=0.7",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded",
    "Referer": "https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaek.do"
  },
  "body": "eopjong_gbcd=1", // 정의된 Request 필드들에 대해 urlencoded를 수행한 값이 여기에 들어가야 한다.
  "method": "POST"
});
```

상세한 Body 데이터의 타입은 다음과 같다.
```typescript
// 빈 필드는 해당 조건에 대해 전체 조회를 의미하며, eopjong_gbcd (복무 형태) 값은 무조건 들어가야 함.

// eopjong_gbcd_list와 일치하도록 선언
export type al_eopjong_gbcd: []IndustryCode;

// 해당 필드는 Key만 선언하고 Value는 비워둔 채로 선언할 것
export type al_eopjong_gbcd_yn: '';

// 업종 선택
export type eopjong_gbcd_list: []IndustryCode;

// 복무 형태
export type eopjong_gbcd: AgentType;

// 기업 규모
export type gegyumo_cd: '' | CompanySizeCode;

// API 요청시 IndustryCode가 여러 개인 경우, form-data 내 해당 필드가 별개의 필드로 중복 선언되어야 함
export type eopjong_cd: IndustryCode;

// 회사 이름
export type eopche_nm: '' | string;

// 시/도 선택
export type sido_addr = 
  | '서울특별시'
  | '부산광역시'
  | '대구광역시'
  | '인천광역시'
  | '광주광역시'
  | '대전광역시'
  | '울산광역시'
  | '세종특별자치시'
  | '경기도'
  | '충청북도'
  | '충청남도'
  | '전라남도'
  | '경상북도'
  | '경상남도'
  | '제주특별자치도'
  | '강원특별자치도'
  | '전북특별자치도';

// sigungu_addr는 sido_addr의 하위 시/군/구를 의미
//
// 비어있다면 sido_addr의 지역 전체를 조회 함.
//
// 예시 1) sido_addr="서울특별시"라면, sigungu_addr="강남구"가 될 수 있음
// 예시 2) sido_addr="경기도"라면, sigungu_addr="수원시"가 될 수 있음
export type sigungu_addr: string;

// 병무청 병역일터에 채용 공고를 등록한 업체
export type chaeyongym: 'Y' | '';

// 해당 기업에 현역(H) 또는 보충역(B) TO가 1개 이상 있는지 지정
// API 요청시 form-data 내 해당 필드를 별개로 중복 선언하여 현역/보충역 둘 다 조회 할 수 있음
export type bjinwonym: 'H' | 'B';

// -------------------------------------------------------------------- //

enum AgentType {
  산업기능요원 = 1,
  전문연구요원 = 2,
  승선근무예비역 = 3
}

enum IndustryCode {
  // 제조 (Manufacturing)
  철강 = '11101',
  기계 = '11102',
  전기 = '11103',
  전자 = '11104',
  화학 = '11105',
  섬유 = '11106',
  신발 = '11107',`
  시멘요업 = '11108', // 시멘트/요업 (Cement/Ceramics)
  생활용품 = '11109', // 생활용품 (Household Goods)
  통신기기 = '11110', // 통신기기 (Communication Equipment)
  정보처리 = '11111', // 정보처리 (Information Processing)
  게임SW = '11112', // 게임 S/W (Game Software)
  영상게임 = '11113', // 영상게임 (Video Games)
  의료의약 = '11114', // 의료/의약 (Medical/Pharmaceutical)
  식음료 = '11115', // 식음료 (Food and Beverage)
  농산물가공 = '11116', // 농산물 가공 (Agricultural Product Processing)
  수산물가공 = '11117', // 수산물 가공 (Fishery Product Processing)
  임산물가공 = '11118', // 임산물 가공 (Forest Product Processing)
  동물약품 = '11119', // 동물 약품 (Animal Medicine)
  애니메이션 = '11120', // 애니메이션 (Animation)

  // 광업 (Mining)
  석탄채굴 = '11201', // 석탄 채굴 (Coal Mining)
  일반광물채굴 = '11202', // 일반 광물 채굴 (General Mineral Mining)
  선광제련 = '11203', // 선광/제련 (Ore Dressing/Smelting)

  // 전력, 가스, 수도 (Electricity, Gas, Water)
  에너지 = '11301', // 에너지 (Energy)

  // 건설업 (Construction)
  국내건설 = '11401', // 국내 건설 (Domestic Construction)
  국외건설 = '11402', // 국외 건설 (Overseas Construction)

  // 운수업 (Transportation)
  내항화물 = '11501', // 내항 화물 (Coastal Cargo)
  외항화물 = '11502', // 외항 화물 (Ocean-going Cargo)
  내항선박관리 = '11503', // 내항 선박 관리 (Coastal Vessel Management)
  외항선박관리 = '11504', // 외항 선박 관리 (Ocean-going Vessel Management)

  // 수산업 (Fisheries)
  근해 = '11601', // 근해 (Inshore Fishing)
  원양 = '11602', // 원양 (Deep-sea Fishing)
}

enum CompanySizeCode {
  대기업 = '01', // Large Enterprise
  중소기업 = '02', // Small and Medium Enterprise (SME)
  중견기업 = '04', // Middle Market Enterprise
  농어민후계 = 'A1', // Successors to Farmers/Fishermen
  기타 = 'Z', // etc
}
```

HTTP 요청 성공시 응답은 `.xls` 파일이며, 이를 `.csv` 형태로 만듦과 동시에 최대 30개의 row만 리턴하도록 한다. (단, 첫번째 row는 Header이므로 이는 생략한다.)
Javascript 환경에서 xlsx 라이브러리를 사용했을 때 기준의 코드 예시는 다음과 같을 것이다. (실제 구현은 Typescript로 진행하도록 한다.)

```js
  const XLSX = require('xlsx');

  const workbook = XLSX.readFile('resp.xls');
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  // .xls -> .csv 형태로 변환하여 csv string을 얻는다.
  const strData = XLSX.utils.sheet_to_csv(worksheet, { header: 1 });

  // \n으로 split 시켜 Array를 얻고, Header (row 0)를 제외한 나머지 부분을 slice하여 리턴한다. 
  return strData
    .split('\n')
    .slice(1, 31)
```