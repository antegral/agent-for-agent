#!/usr/bin/env node

/**
 * Military Manpower Administration (MMA) MCP Server
 * 병무청 병역특례 업체 조회 MCP 서버
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { search_designated_entities } from './mma-api.js';
import { MMAApiError, MilitaryWorkplaceSearchQuery } from './types.js';

/**
 * MCP 도구 정의
 */
const TOOLS: Tool[] = [
  {
    name: 'search_designated_entities',
    description:
      '병무청 병역일터에서 병역특례 지정업체를 검색합니다. ' +
      '산업기능요원, 전문연구요원, 승선근무예비역 복무가 가능한 업체 정보를 조회할 수 있습니다. ' +
      '검색 결과는 CSV 형식으로 반환되며, 최대 30개의 업체 정보가 제공됩니다.',
    inputSchema: {
      type: 'object',
      properties: {
        service_type: {
          type: 'string',
          enum: ['산업기능요원', '전문연구요원', '승선근무예비역'],
          description: '(필수) 복무 형태를 선택합니다.',
        },
        company_size: {
          type: 'string',
          enum: ['', '대기업', '중소기업', '중견기업', '농어민후계', '기타'],
          description: '기업 규모 (선택사항, 빈 값은 전체 조회)',
        },
        industry_sectors: {
          oneOf: [
            {
              type: 'string',
              enum: [
                '철강',
                '기계',
                '전기',
                '전자',
                '화학',
                '섬유',
                '신발',
                '시멘요업',
                '생활용품',
                '통신기기',
                '정보처리',
                '게임SW',
                '영상게임',
                '의료의약',
                '식음료',
                '농산물가공',
                '수산물가공',
                '임산물가공',
                '동물약품',
                '애니메이션',
                '석탄채굴',
                '일반광물채굴',
                '선광제련',
                '에너지',
                '국내건설',
                '국외건설',
                '내항화물',
                '외항화물',
                '내항선박관리',
                '외항선박관리',
                '근해',
                '원양',
              ],
            },
            {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  '철강',
                  '기계',
                  '전기',
                  '전자',
                  '화학',
                  '섬유',
                  '신발',
                  '시멘요업',
                  '생활용품',
                  '통신기기',
                  '정보처리',
                  '게임SW',
                  '영상게임',
                  '의료의약',
                  '식음료',
                  '농산물가공',
                  '수산물가공',
                  '임산물가공',
                  '동물약품',
                  '애니메이션',
                  '석탄채굴',
                  '일반광물채굴',
                  '선광제련',
                  '에너지',
                  '국내건설',
                  '국외건설',
                  '내항화물',
                  '외항화물',
                  '내항선박관리',
                  '외항선박관리',
                  '근해',
                  '원양',
                ],
              },
            },
          ],
          description: '업종 코드 (선택사항, 여러 개 가능)',
        },
        company_name: {
          type: 'string',
          description: '회사 이름 (선택사항, 빈 값은 전체 조회)',
        },
        city_province: {
          type: 'string',
          enum: [
            '서울특별시',
            '부산광역시',
            '대구광역시',
            '인천광역시',
            '광주광역시',
            '대전광역시',
            '울산광역시',
            '세종특별자치시',
            '경기도',
            '충청북도',
            '충청남도',
            '전라남도',
            '경상북도',
            '경상남도',
            '제주특별자치도',
            '강원특별자치도',
            '전북특별자치도',
          ],
          description: '시/도 선택 (선택사항, 빈 값은 전국 전체 조회)',
        },
        city_district: {
          type: 'string',
          description: '시/군/구 주소 (선택사항, 빈 값은 city_province 전체 조회)',
        },
        is_hiring: {
          type: 'boolean',
          enum: [true, false],
          description: "병무청 채용 공고 등록 업체 여부 (선택사항, 'Y' 또는 빈 값)",
        },
        military_service_status: {
          oneOf: [
            {
              type: 'string',
              enum: ['현역', '보충역'],
            },
            {
              type: 'array',
              items: {
                type: 'string',
                enum: ['현역', '보충역'],
              },
            },
          ],
          description: '현역 또는 보충역 TO 유무 (전체 조회시 H, B 모두 입력)',
        },
      },
      required: ['service_type'],
    },
  },
];

/**
 * MCP 서버 생성 및 초기화
 */
async function main() {
  const server = new Server(
    {
      name: 'mma-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  /**
   * 도구 목록 반환 핸들러
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  /**
   * 도구 실행 핸들러
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error('arguments are required');
    }

    const query = {
      eopjong_gbcd: args.service_type,
      gegyumo_cd: args.company_size,
      eopjong_cd: args.industry_sectors,
      eopche_nm: args.company_name,
      sido_addr: args.city_province,
      sigungu_addr: args.city_district,
      chaeyongym: (args.is_hiring as boolean | undefined) ? 'Y' : '',
    } as MilitaryWorkplaceSearchQuery;

    const military_service_status = args.military_service_status as string[] | undefined;
    query.bjinwonym = [] as ('H' | 'B')[];
    if (military_service_status && military_service_status.includes('현역')) {
      query.bjinwonym.push('H');
    }

    if (military_service_status && military_service_status.includes('보충역')) {
      query.bjinwonym.push('B');
    }

    try {
      switch (name) {
        case 'search_designated_entities': {
          if (!query.eopjong_gbcd) {
            throw new Error('eopjong_gbcd parameter is required');
          }

          const result = await search_designated_entities(query);

          return {
            content: [
              {
                type: 'text',
                text: result,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      if (error instanceof MMAApiError) {
        return {
          content: [
            {
              type: 'text',
              text: `MMA API Error: ${error.message}${error.statusCode ? ` (Status: ${error.statusCode})` : ''}`,
            },
          ],
          isError: true,
        };
      }

      if (error instanceof Error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: 'Unknown error occurred',
          },
        ],
        isError: true,
      };
    }
  });

  /**
   * 서버 시작
   */
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MMA MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
