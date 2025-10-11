import { buildFormData, search_designated_entities } from './mma-api.js';
import { MilitaryWorkplaceSearchQuery } from './types';

(() => {
  const query: MilitaryWorkplaceSearchQuery = {
    eopjong_gbcd: '산업기능요원',
    eopjong_cd: ['게임SW', '정보처리'],
    sido_addr: '서울특별시',
    sigungu_addr: '강남구',
  };

  console.log('\x1b[1m%s\x1b[0m', `Form Data: ${buildFormData(query)}`);

  search_designated_entities(query)
    .then((result) => {
      console.log(
        '\x1b[1m\x1b[32m%s\x1b[0m',
        `==== Result (${result.split('\n').length - 1} rows) ==============================================`,
      );
      for (const row of result.split('\n')) {
        if (row.includes('업체명')) {
          continue;
        }
        console.log('\x1b[32m%s\x1b[0m', row);
      }
    })
    .catch((error) => {
      console.error(error);
    });
})();
