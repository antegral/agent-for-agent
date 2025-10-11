/**
 * Military Manpower Administration (MMA) API Types
 * 병무청 병역일터 API 타입 정의
 */

/**
 * 복무 형태 (Agent Type)
 */
export enum AgentType {
  산업기능요원 = '1',
  전문연구요원 = '2',
  승선근무예비역 = '3',
}

export type AgentTypeKeys = '산업기능요원' | '전문연구요원' | '승선근무예비역';

/**
 * 업종 코드 (Industry Code)
 */
export enum IndustryCode {
  // 제조 (Manufacturing)
  철강 = '11101',
  기계 = '11102',
  전기 = '11103',
  전자 = '11104',
  화학 = '11105',
  섬유 = '11106',
  신발 = '11107',
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

export type IndustryCodeKeys =
  | '철강'
  | '기계'
  | '전기'
  | '전자'
  | '화학'
  | '섬유'
  | '신발'
  | '시멘요업'
  | '생활용품'
  | '통신기기'
  | '정보처리'
  | '게임SW'
  | '영상게임'
  | '의료의약'
  | '식음료'
  | '농산물가공'
  | '수산물가공'
  | '임산물가공'
  | '동물약품'
  | '애니메이션'
  | '석탄채굴'
  | '일반광물채굴'
  | '선광제련'
  | '에너지'
  | '국내건설'
  | '국외건설'
  | '내항화물'
  | '외항화물'
  | '내항선박관리'
  | '외항선박관리'
  | '근해'
  | '원양';

/**
 * 기업 규모 코드 (Company Size Code)
 */
export enum CompanySizeCode {
  대기업 = '01', // Large Enterprise
  중소기업 = '02', // Small and Medium Enterprise (SME)
  중견기업 = '04', // Middle Market Enterprise
  농어민후계 = 'A1', // Successors to Farmers/Fishermen
  기타 = 'Z', // etc
}

export type CompanySizeCodeKeys = '대기업' | '중소기업' | '중견기업' | '농어민후계' | '기타';

/**
 * 시/도 주소 (Sido Address)
 */
export type SidoAddr =
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

/**
 * 병역일터 검색 조건 파라미터
 *
 * 빈 값('')은 해당 조건에 대해 전체 조회를 의미합니다.
 */
export interface MilitaryWorkplaceSearchQuery {
  /** **(필수)** 복무 형태: '산업기능요원', '전문연구요원', '승선근무예비역' 중 하나 */
  eopjong_gbcd: AgentTypeKeys;

  /** 기업 규모: '대기업', '중소기업', '중견기업', '농어민후계', '기타' 중 하나 또는 빈 값(전체 조회) */
  gegyumo_cd?: '' | CompanySizeCodeKeys;

  /** 업종 코드. API 요청 시 form-data 내에서 여러 개가 중복 선언될 수 있음 */
  eopjong_cd?: IndustryCodeKeys | IndustryCodeKeys[];

  /** 회사 이름. 빈 값은 전체 조회를 의미 */
  eopche_nm?: string;

  /** 시/도 선택 */
  sido_addr?: SidoAddr;

  /** 시/도 내의 시/군/구 주소. 빈 값은 해당 sido_addr 전체를 조회 함 */
  sigungu_addr?: string;

  /** 병무청 채용 공고 등록 업체 여부. 'Y' 또는 빈 값(전체 조회) */
  chaeyongym?: '' | 'Y';

  /** 현역('H') 또는 보충역('B') TO 유무 지정. API 요청 시 둘 다 조회하려면 배열로 전달 */
  bjinwonym?: 'H' | 'B' | ('H' | 'B')[];
}

/**
 * Custom API Error
 */
export class MMAApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'MMAApiError';
    Object.setPrototypeOf(this, MMAApiError.prototype);
  }
}
