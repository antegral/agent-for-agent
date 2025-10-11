/**
 * Military Manpower Administration (MMA) API Client
 * 병무청 병역일터 API 클라이언트
 */

import * as XLSX from 'xlsx';
import {
  MilitaryWorkplaceSearchQuery,
  AgentType,
  IndustryCode,
  CompanySizeCode,
  MMAApiError,
} from './types.js';

/**
 * MMA API Base URL
 */
const MMA_API_BASE_URL = 'https://work.mma.go.kr/caisBYIS/search';
const MMA_API_ENDPOINT = `${MMA_API_BASE_URL}/downloadBYJJEopCheExcel.do`;

/**
 * 검색 쿼리를 URL-encoded form data로 변환
 */
export function buildFormData(query: MilitaryWorkplaceSearchQuery): string {
  const params = new URLSearchParams();

  // 필수 필드: eopjong_gbcd (복무 형태)
  const agentTypeValue = AgentType[query.eopjong_gbcd];
  params.append('eopjong_gbcd', agentTypeValue);

  // al_eopjong_gbcd_yn: 빈 문자열로 설정
  params.append('al_eopjong_gbcd_yn', '');

  // gegyumo_cd: 기업 규모
  if (query.gegyumo_cd !== undefined && query.gegyumo_cd !== '') {
    const sizeCode = CompanySizeCode[query.gegyumo_cd];
    if (sizeCode) {
      params.append('gegyumo_cd', sizeCode);
    }
  } else if (query.gegyumo_cd === '') {
    params.append('gegyumo_cd', '');
  }

  // eopjong_cd: 업종 코드 (여러 개 가능)
  if (query.eopjong_cd) {
    const codes = Array.isArray(query.eopjong_cd) ? query.eopjong_cd : [query.eopjong_cd];
    codes.forEach((industry) => {
      const code = IndustryCode[industry];
      if (code) {
        params.append('eopjong_cd', code);
      }
    });

    // e.g) 11111,11112 (and no encoding)
    const codeValues = codes.map((industry) => IndustryCode[industry]).filter(Boolean);
    const al_eopjong_gbcd = codeValues.join(',');
    const eopjong_gbcd_list = codeValues.join(','); // al_eopjong_gbcd와 동일

    if (al_eopjong_gbcd) {
      params.append('al_eopjong_gbcd', al_eopjong_gbcd);
    }

    if (eopjong_gbcd_list) {
      params.append('eopjong_gbcd_list', eopjong_gbcd_list);
    }
  }

  // eopche_nm: 회사 이름
  if (query.eopche_nm !== undefined) {
    params.append('eopche_nm', query.eopche_nm);
  }

  // sido_addr: 시/도
  if (query.sido_addr) {
    params.append('sido_addr', query.sido_addr);
  }

  // sigungu_addr: 시/군/구
  if (query.sigungu_addr !== undefined) {
    params.append('sigungu_addr', query.sigungu_addr);
  }

  // chaeyongym: 채용 공고 등록 업체
  if (query.chaeyongym !== undefined) {
    params.append('chaeyongym', query.chaeyongym);
  }

  // bjinwonym: 현역/보충역 TO 유무 (여러 개 가능)
  if (query.bjinwonym) {
    const values = Array.isArray(query.bjinwonym) ? query.bjinwonym : [query.bjinwonym];
    values.forEach((value) => {
      params.append('bjinwonym', value);
    });
  }

  return params.toString();
}

/**
 * 병역특례 업체 검색
 *
 * @param query 검색 조건
 * @returns CSV 형식의 검색 결과 (최대 30개 row, 헤더 제외)
 */
export async function search_designated_entities(
  query: MilitaryWorkplaceSearchQuery,
): Promise<string> {
  // Form data 생성
  const formData = buildFormData(query);

  // HTTP 요청
  const response = await fetch(MMA_API_ENDPOINT, {
    method: 'POST',
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'ko,en-US;q=0.9,en;q=0.8',
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded',
      Referer: 'https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaek.do',
    },
    body: formData,
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error(`error: ${error}`);
      throw new MMAApiError(`MMA API request failed: ${error.message}`, error.status);
    });

  // 응답을 ArrayBuffer로 받아서 처리
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // 첫 번째 시트 가져오기
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new MMAApiError('No worksheet found in the response');
  }

  const worksheet = workbook.Sheets[firstSheetName];

  // .xls -> .csv 형태로 변환
  const strData = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n' });

  // \n으로 split하여 Array를 얻고, Header (row 0)를 제외한 나머지 부분을 slice
  // 최대 30개의 row만 리턴 (헤더 제외)
  const rows = strData.split('\n');
  const dataRows = rows.slice(1, 31); // 헤더 제외, 최대 30개

  // 빈 행 필터링
  const filteredRows = dataRows.filter((row) => row.trim() !== '');

  if (filteredRows.length === 0) {
    return 'No data found for the given search criteria.';
  }

  // 헤더와 데이터를 함께 반환
  const header = rows[0];
  return `${header}\n${filteredRows.join('\n')}`;
}

/**
 * 유틸리티: 업종 코드 목록을 문자열로 변환
 */
export function getIndustryCodes(): Record<string, string> {
  const codes: Record<string, string> = {};
  for (const [key, value] of Object.entries(IndustryCode)) {
    if (typeof value === 'string') {
      codes[key] = value;
    }
  }
  return codes;
}

/**
 * 유틸리티: 복무 형태 코드 목록을 문자열로 변환
 */
export function getAgentTypes(): Record<string, string> {
  const types: Record<string, string> = {};
  for (const [key, value] of Object.entries(AgentType)) {
    if (typeof value === 'string') {
      types[key] = value;
    }
  }
  return types;
}

/**
 * 유틸리티: 기업 규모 코드 목록을 문자열로 변환
 */
export function getCompanySizeCodes(): Record<string, string> {
  const codes: Record<string, string> = {};
  for (const [key, value] of Object.entries(CompanySizeCode)) {
    if (typeof value === 'string') {
      codes[key] = value;
    }
  }
  return codes;
}
