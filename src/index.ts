#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

async function main(): Promise<void> {
  const runtime = createServer();
  await runtime.server.connect(new StdioServerTransport());
  const shutdown = (): void => {
    void runtime.close().catch((error: unknown) => {
      console.error('MMA MCP Server shutdown failed:', error);
      process.exitCode = 1;
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  console.error('MMA MCP Server running on stdio');
}

void main().catch((error: unknown) => {
  console.error('Fatal error in main():', error);
  process.exitCode = 1;
});
