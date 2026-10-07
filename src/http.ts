import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';

const host = 'mcp.antegral.net';
const origin = 'https://mcp.antegral.net';
const protocolVersion = '2025-11-25';
const maxBodyBytes = 256 * 1024;

function reply(response: ServerResponse, status: number, message: string): void {
  if (response.destroyed || response.writableEnded) return;
  response.writeHead(status, { 'Content-Type': 'application/json', Connection: 'close', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify({ error: message }));
}

async function exchange(request: IncomingMessage, response: ServerResponse, abort: AbortController): Promise<void> {
  const runtime = createServer(abort.signal);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  const disconnected = (): void => { if (!response.writableFinished) abort.abort(); };
  const cancel = (): void => { request.destroy(); response.destroy(); };
  request.on('aborted', disconnected);
  response.on('close', disconnected);
  abort.signal.addEventListener('abort', cancel, { once: true });
  const lifetime = setTimeout(() => abort.abort(), 75_000);
  const bodyDeadline = setTimeout(() => abort.abort(), 5_000);
  let completed: (() => void) | undefined;
  try {
    const declaredLength = request.headers['content-length'];
    if (declaredLength !== undefined && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maxBodyBytes)) {
      reply(response, 413, 'Request body too large'); return;
    }
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of request) {
      const bytes = chunk as Buffer;
      length += bytes.length;
      if (length > maxBodyBytes) { reply(response, 413, 'Request body too large'); return; }
      chunks.push(bytes);
    }
    clearTimeout(bodyDeadline);
    if (abort.signal.aborted) return;
    let parsedBody: unknown;
    try { parsedBody = JSON.parse(Buffer.concat(chunks, length).toString('utf8')) as unknown; }
    catch { reply(response, 400, 'Invalid JSON'); return; }
    // A batch would bypass the one-native-request capacity limit.
    if (Array.isArray(parsedBody)) { reply(response, 400, 'JSON-RPC batches are not supported'); return; }
    if (parsedBody !== null && typeof parsedBody === 'object' && 'method' in parsedBody && parsedBody.method === 'initialize') {
      const params = 'params' in parsedBody ? parsedBody.params : undefined;
      if (params === null || typeof params !== 'object' || !('protocolVersion' in params) || params.protocolVersion !== protocolVersion) {
        reply(response, 400, 'Only MCP protocol 2025-11-25 is supported'); return;
      }
    } else if (request.headers['mcp-protocol-version'] !== protocolVersion) {
      reply(response, 400, 'MCP-Protocol-Version must be 2025-11-25'); return;
    }
    const responseDone = new Promise<void>((resolve) => {
      completed = resolve;
      response.once('finish', completed);
      response.once('close', completed);
      if (response.destroyed || response.writableFinished) resolve();
    });
    response.setHeader('Cache-Control', 'no-store');
    await runtime.server.connect(transport);
    // SDK 1.x dispatch returns before its asynchronous tool response is written.
    await transport.handleRequest(request, response, parsedBody);
    await responseDone;
  } catch {
    if (!abort.signal.aborted) reply(response, 500, 'MCP request failed');
  } finally {
    clearTimeout(lifetime);
    clearTimeout(bodyDeadline);
    request.off('aborted', disconnected);
    response.off('close', disconnected);
    abort.signal.removeEventListener('abort', cancel);
    if (completed) {
      response.off('finish', completed);
      response.off('close', completed);
    }
    // Capacity is retained until cancelled native fetch/reader work has settled.
    await runtime.close();
    if (!request.complete) request.destroy();
  }
}

async function main(): Promise<void> {
  let draining = false;
  let active: { abort: AbortController; done: Promise<void> } | undefined;
  const server = createHttpServer({ maxHeaderSize: 16 * 1024, headersTimeout: 5_000, requestTimeout: 10_000, keepAliveTimeout: 5_000 }, (request, response) => {
    if (request.headers.host !== host || (request.headers.origin !== undefined && request.headers.origin !== origin)) {
      reply(response, 403, 'Host or Origin not allowed'); return;
    }
    if (request.method === 'GET' && (request.url === '/healthz' || request.url === '/readyz')) {
      reply(response, request.url === '/readyz' && draining ? 503 : 200, draining ? 'draining' : 'ok'); return;
    }
    if (request.url !== '/mcp') { reply(response, 404, 'Not found'); return; }
    if (request.method !== 'POST') { reply(response, 405, 'Only POST is supported'); return; }
    if (request.headers['mcp-session-id'] !== undefined || request.headers.cookie !== undefined || request.headers.authorization !== undefined) {
      reply(response, 400, 'Sessions, cookies and bearer authentication are not supported'); return;
    }
    if (draining || active) { reply(response, 503, draining ? 'Draining' : 'Busy'); return; }
    const abort = new AbortController();
    const done = exchange(request, response, abort)
      .catch(() => { process.stderr.write('ams-mcp: HTTP cleanup failed.\n'); process.exitCode = 1; })
      .finally(() => { active = undefined; });
    active = { abort, done };
  });
  server.maxRequestsPerSocket = 100;
  server.on('clientError', (_, socket) => { socket.destroy(); });
  let cleanup: Promise<void> | undefined;
  const shutdown = (): Promise<void> => {
    cleanup ??= (async () => {
      draining = true;
      const hardDeadline = setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 35_000);
      const closed = new Promise<void>((resolve) => server.close(() => resolve()));
      active?.abort.abort();
      await active?.done;
      server.closeAllConnections();
      await closed;
      clearTimeout(hardDeadline);
      process.off('SIGINT', onSignal);
      process.off('SIGTERM', onSignal);
    })();
    return cleanup;
  };
  const onSignal = (): void => { void shutdown().catch(() => { process.exitCode = 1; process.stderr.write('ams-mcp: HTTP shutdown failed.\n'); }); };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(8936, '0.0.0.0', () => { server.off('error', reject); resolve(); });
    });
  } catch { await shutdown(); throw new Error('HTTP startup failed'); }
}

void main().catch(() => {
  process.exitCode = 1;
  process.stderr.write('ams-mcp: HTTP startup failed; check listener availability.\n');
});
