import { search_designated_entities } from '../mma-api.js';
import { MilitaryWorkplaceSearchQuery } from '../types.js';

describe('MMA API Client', () => {
  beforeEach(() => {
    // 각 테스트 전에 mock 초기화
    jest.clearAllMocks();
  });

  describe('search_designated_entities', () => {
    test('should fetch and return CSV data for valid query', async () => {
      // test.ts와 동일한 쿼리 사용
      const query: MilitaryWorkplaceSearchQuery = {
        eopjong_gbcd: '산업기능요원',
        eopjong_cd: ['게임SW', '정보처리'],
        sido_addr: '서울특별시',
        sigungu_addr: '강남구',
      };

      const result = await search_designated_entities(query);

      // CSV 형식의 결과 확인
      expect(result).not.toBe('No data found for the given search criteria.');

      const lines = result.split('\n').filter((line) => line.trim() !== '');
      expect(lines.length).toBeGreaterThan(1);
    });
  });
});
