# MMA MCP Server

[![CI](https://github.com/antegral/agent-for-agent/workflows/CI/badge.svg)](https://github.com/antegral/agent-for-agent/actions/workflows/ci.yml)
[![CodeQL](https://github.com/antegral/agent-for-agent/workflows/CodeQL/badge.svg)](https://github.com/antegral/agent-for-agent/actions/workflows/codeql.yml)

병무청 병역일터(Military Manpower Administration) API를 위한 Model Context Protocol (MCP) 서버입니다.

## 기능

이 MCP 서버는 병무청 병역일터에서 병역특례 지정업체 정보를 조회할 수 있는 도구를 제공합니다.

### `search_designated_entities`

병역특례 업체 검색 및 조회 기능을 제공합니다.

**파라미터:**

#### 필수 파라미터
- `eopjong_gbcd` (string): 복무 형태 선택 (필수)
  - `'산업기능요원'` - 산업기능요원
  - `'전문연구요원'` - 전문연구요원
  - `'승선근무예비역'` - 승선근무예비역

#### 선택 파라미터
- `al_eopjong_gbcd` (array): 업종 그룹 코드 리스트
  - 예: `['정보처리', '게임SW', '전자']`
  
- `eopjong_gbcd_list` (array): 업종 선택 목록
  - 업종 코드 배열
  
- `gegyumo_cd` (string): 기업 규모
  - `''` - 전체 (기본값)
  - `'대기업'` - 대기업
  - `'중소기업'` - 중소기업
  - `'중견기업'` - 중견기업
  - `'농어민후계'` - 농어민 후계자
  - `'기타'` - 기타

- `eopjong_cd` (string | array): 업종 코드
  - 단일 값 또는 배열로 전달 가능
  - 예: `'정보처리'` 또는 `['정보처리', '전자']`

- `eopche_nm` (string): 회사 이름
  - 특정 회사명으로 검색
  - 빈 값은 전체 조회

- `sido_addr` (string): 시/도 선택
  - 예: `'서울특별시'`, `'경기도'`, `'부산광역시'` 등

- `sigungu_addr` (string): 시/군/구 주소
  - sido_addr의 하위 지역
  - 예: `'강남구'`, `'수원시'` 등
  - 빈 값은 해당 시/도 전체 조회

- `chaeyongym` (string): 병무청 채용 공고 등록 업체 여부
  - `''` - 전체 (기본값)
  - `'Y'` - 채용 공고 등록 업체만

- `bjinwonym` (string | array): TO 유무
  - `'H'` - 현역 TO 있음
  - `'B'` - 보충역 TO 있음
  - `['H', 'B']` - 현역/보충역 모두 조회

**반환값:**
- CSV 형식의 검색 결과 (헤더 포함)
- 최대 30개의 업체 정보
- 각 행은 업체명, 업종, 위치, TO 정보 등을 포함

**사용 예시:**

```typescript
// 산업기능요원 - 정보처리 업종 - 서울 강남구
{
  "eopjong_gbcd": "산업기능요원",
  "eopjong_cd": "정보처리",
  "sido_addr": "서울특별시",
  "sigungu_addr": "강남구"
}

// 전문연구요원 - 중소기업 - 채용공고 있음
{
  "eopjong_gbcd": "전문연구요원",
  "gegyumo_cd": "중소기업",
  "chaeyongym": "Y"
}

// 특정 회사명 검색
{
  "eopjong_gbcd": "산업기능요원",
  "eopche_nm": "네이버"
}
```

## 업종 코드 목록

### 제조업 (Manufacturing)
- 철강, 기계, 전기, 전자, 화학, 섬유, 신발
- 시멘요업, 생활용품, 통신기기
- 정보처리, 게임SW, 영상게임
- 의료의약, 식음료
- 농산물가공, 수산물가공, 임산물가공, 동물약품
- 애니메이션

### 광업 (Mining)
- 석탄채굴, 일반광물채굴, 선광제련

### 에너지 (Energy)
- 에너지

### 건설업 (Construction)
- 국내건설, 국외건설

### 운수업 (Transportation)
- 내항화물, 외항화물, 내항선박관리, 외항선박관리

### 수산업 (Fisheries)
- 근해, 원양

## CI/CD

이 프로젝트는 GitHub Actions를 사용하여 자동화된 CI/CD 파이프라인을 제공합니다.

### 자동화 워크플로우

- **CI (Continuous Integration)**: `main`, `develop` 브랜치에 push하거나 PR 생성 시 자동으로 린트, 테스트, 빌드를 실행합니다.
- **Release**: `v*.*.*` 형식의 태그를 push하면 자동으로 GitHub Release를 생성하고 빌드 결과물을 첨부합니다.
- **CodeQL**: 보안 취약점 자동 분석 (매주 월요일 + PR/Push 시)
- **Dependabot**: 의존성 자동 업데이트 제안 (매주)

### 릴리즈 생성 방법

```bash
# 버전 태그 생성 및 푸시
git tag v1.0.0
git push origin v1.0.0
```

자세한 내용은 [.github/workflows/README.md](.github/workflows/README.md)를 참조하세요.

## 설치

```bash
pnpm install
```

## 빌드

```bash
pnpm build
```

## 실행

```bash
pnpm start
```

## 개발 모드

```bash
pnpm dev
```

## 테스트

```bash
pnpm test
```

## MCP 클라이언트 설정

Claude Desktop 또는 다른 MCP 클라이언트에서 이 서버를 사용하려면, 설정 파일에 다음을 추가하세요:

### Claude Desktop 설정

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%\Claude\claude_desktop_config.json`
Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mma": {
      "command": "node",
      "args": ["/path/to/agent-for-agent/dist/index.js"]
    }
  }
}
```

## 프로젝트 구조

```
agent-for-agent/
├── src/
│   ├── index.ts          # MCP 서버 메인 엔트리포인트
│   ├── mma-api.ts        # MMA API 클라이언트 함수
│   ├── types.ts          # TypeScript 타입 정의
│   └── __tests__/
│       └── mma-api.test.ts  # 테스트 코드
├── dist/                 # 빌드 결과물 (TypeScript 컴파일 후)
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## 기술 스택

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Framework**: MCP SDK (@modelcontextprotocol/sdk)
- **HTTP Client**: Native Fetch API
- **Excel Parser**: xlsx (SheetJS)
- **Validation**: Zod
- **Testing**: Jest + ts-jest
- **Code Quality**: ESLint, Prettier
- **Package Manager**: pnpm

## 개발 가이드

### 타입 시스템

이 프로젝트는 TypeScript의 strict mode를 사용하며, 모든 타입이 `types.ts`에 정의되어 있습니다.

### API 클라이언트

`mma-api.ts`는 병무청 API와 통신하는 로직을 포함합니다:
- Form data 생성 및 인코딩
- HTTP 요청 처리
- Excel 파일 파싱 및 CSV 변환
- 에러 핸들링

### 테스트

테스트는 Jest를 사용하며, `fetch` API를 모킹하여 실제 네트워크 요청 없이 테스트합니다.

```bash
# 전체 테스트 실행
pnpm test

# Watch 모드로 테스트
pnpm test:watch
```

### 코드 품질

```bash
# Linting
pnpm lint

# Formatting
pnpm format
```

## 라이선스

MIT

## 주의사항

이 서버는 [병무청 병역일터](https://work.mma.go.kr)의 공개 API를 사용합니다. 
API 사용 시 해당 사이트의 이용 약관을 준수해야 합니다.

## 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 참고 자료

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [병무청 병역일터](https://work.mma.go.kr)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
