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
- `service_type` (string): `'산업기능요원'`, `'전문연구요원'`, `'승선근무예비역'` 중 하나

#### 선택 파라미터
- `company_size` (string): `''`, `'대기업'`, `'중소기업'`, `'중견기업'`, `'농어민후계'`, `'기타'`
- `industry_sectors` (string | string[]): 업종 이름, 예: `'정보처리'` 또는 `['정보처리', '게임SW']`
- `company_name` (string): 업체명 검색어
- `city_province` (string): 시/도 이름, 예: `'서울특별시'`
- `city_district` (string): 시/군/구 검색어
- `is_hiring` (boolean): `true`이면 병무청 채용 공고 등록 업체로 제한
- `military_service_status` (string | string[]): `'현역'`, `'보충역'` 또는 두 값의 배열

위 이름은 MCP 도구 인자입니다. 병무청 form POST 필드로의 변환은 서버에서 처리합니다.

**반환값:**
- CSV 형식의 검색 결과 (헤더 포함)
- 최대 30개의 업체 정보
- 각 행은 업체명, 업종, 위치, TO 정보 등을 포함

**사용 예시:**

```typescript
// 산업기능요원 - 정보처리 업종 - 서울 강남구
{
  "service_type": "산업기능요원",
  "industry_sectors": "정보처리",
  "city_province": "서울특별시",
  "city_district": "강남구"
}

// 전문연구요원 - 중소기업 - 채용공고 있음
{
  "service_type": "전문연구요원",
  "company_size": "중소기업",
  "is_hiring": true
}

// 특정 회사명 검색
{
  "service_type": "산업기능요원",
  "company_name": "네이버"
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

### 내부 HTTP 실행

```bash
pnpm serve
```

`node dist/http.js`는 `0.0.0.0:8936`에서 내부 전용 `POST /mcp`를 제공합니다. stdio와 HTTP는 같은 서버 팩토리와 도구 등록을 사용하며, 네이티브 도구는 `search_designated_entities` 하나입니다. resources와 prompts는 등록하지 않습니다.

HTTP는 MCP `2025-11-25`만 허용하며 SDK의 stateless JSON 응답 모드를 사용합니다. 세션, 쿠키, SSE 및 bearer 인증은 제공하지 않습니다. 모든 요청의 Host는 정확히 `mcp.antegral.net`이어야 하며, Origin은 없거나 `https://mcp.antegral.net`이어야 합니다. 이 검사는 `GET /healthz`, `GET /readyz`에도 적용됩니다. 프로브는 동시 요청 한도와 별도로 처리하며 종료 중 readiness는 503을 반환합니다.

MCP 요청은 한 번에 하나만 처리하며 JSON-RPC 배치를 거부합니다. 요청 본문 한도는 256 KiB, 헤더 및 본문 수신 제한은 각각 5초, 전체 교환 제한은 75초, 종료 제한은 35초입니다. 연결 종료와 요청 취소는 실제 병무청 fetch 및 응답 스트림에도 전달됩니다. 병무청 다운로드는 60초와 16 MiB로 제한하며 HTTP 오류를 성공 데이터로 바꾸거나 재시도하지 않습니다.

Node.js 24 기반 컨테이너는 UID/GID `10001:10001`로 실행합니다. 애플리케이션 자격 증명, 브라우저, 데이터베이스 또는 영구 볼륨은 필요하지 않습니다. 루트 파일 시스템은 읽기 전용으로 둘 수 있으며 쓰기 가능한 임시 경로는 `/tmp`입니다. 병무청 공개 Excel 다운로드에 대한 HTTPS 통신은 필요합니다.

AMS는 `https://antegral.net/mcp`의 네 번째 비공개 백엔드로 배포했으며, 게이트웨이 도구 이름은 `ams.search_designated_entities`, 필요 역할은 `mcp-ams`입니다. 공유 public client `394048911884420192`와 저장된 callback은 변경하지 않았습니다. AMS 및 게이트웨이 ArgoCD 앱은 `Synced/Healthy` 상태이며, 내부 서비스는 게이트웨이에서만 접근하도록 격리했습니다. 배포 상태와 네트워크 격리 확인은 공개 OAuth/MCP 및 실제 병무청 조회 성공을 뜻하지 않습니다.

공개 컨테이너 이미지는 `ghcr.io/antegral/ams-mcp:sha-432f6c1@sha256:bf052f78092833e113a837f4dd2dbf9baaede4bc57a252a963051ac22901a318`입니다. [게시 실행 기록](https://github.com/antegral/agent-for-agent/actions/runs/37643887781)은 소스 `432f6c17a2cb92f0344c85f8eaae6bf39dae34bb`를 고정하여 linux/amd64 및 linux/arm64 이미지를 빌드했습니다. 레지스트리의 OCI 인덱스와 두 아키텍처의 소스 라벨을 익명으로 확인했으며, 이미지 pull 자격 증명은 필요하지 않습니다. 이 게시에 사용한 임시 워크플로우와 브랜치는 게시 후 제거했습니다. 기존 품질 CI는 변경하지 않았습니다.

최종 공개 OAuth/MCP 시나리오는 한 번 실행했습니다. 공유 등록 조회는 HTTP 200으로 기존 설정과 일치했지만, `https://auth.antegral.net/.well-known/openid-configuration`의 공개 OIDC discovery 요청이 HTTP 403을 반환하여 중단했습니다. 이 요청에는 인증 헤더, PAT, 쿠키 또는 내부 Host 재정의를 사용하지 않았습니다. 응답 헤더와 본문이 보존되지 않아 403의 원인은 확인하지 못했습니다. 토큰 발급, 게이트웨이 MCP 호출 및 실제 AMS 병무청 조회에 도달하지 않았으므로 네이티브 조회 동작은 검증하지 못했습니다. 시나리오는 재실행하지 않았습니다.

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
│   ├── http.ts           # 내부 전용 HTTP 엔트리포인트
│   ├── server.ts         # 공유 서버 팩토리 및 네이티브 도구 등록
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
