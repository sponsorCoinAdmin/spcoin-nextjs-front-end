import { FetchRequest, JsonRpcProvider } from 'ethers';

type TraceSink = (line: string) => void;

type RpcSummary = {
  rpcMethod: string;
  rpcId: string;
  rpcBatchSize: number;
  rpcParamsCount: number;
};

type BrowserTraceWindow = typeof window & {
  __spCoinRpcFetchTraceOriginal?: typeof window.fetch;
  __spCoinRpcFetchTraceTargets?: Set<string>;
  __spCoinRpcFetchTracePatched?: boolean;
  __spCoinRpcFetchTraceBuffer?: string[];
  __spCoinRpcFetchTraceSuppressedDepth?: number;
};

const SPONSORCOIN_RPC_URL_PATTERN = /https:\/\/rpc\.sponsorcoin\.org\//i;
const DEFAULT_GET_URL = FetchRequest.createGetUrlFunc();

function decodeBody(body: unknown): string {
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) return body.toString();
  if (body instanceof Uint8Array) return new TextDecoder().decode(body);
  return '';
}

function summarizeRpcBody(body: unknown): RpcSummary {
  const bodyText = decodeBody(body);
  if (!bodyText) return { rpcMethod: '', rpcId: '', rpcBatchSize: 0, rpcParamsCount: 0 };
  try {
    const parsed = JSON.parse(bodyText) as unknown;
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    const record = first && typeof first === 'object' ? (first as Record<string, unknown>) : {};
    const params = Array.isArray(record.params) ? record.params : [];
    return {
      rpcMethod: String(record.method || ''),
      rpcId: String(record.id ?? ''),
      rpcBatchSize: Array.isArray(parsed) ? parsed.length : 1,
      rpcParamsCount: params.length,
    };
  } catch {
    return { rpcMethod: '(unparsed)', rpcId: '', rpcBatchSize: 0, rpcParamsCount: 0 };
  }
}

export function emitSpCoinRpcTrace(line: string, sink?: TraceSink) {
  const nextLine = String(line || '');
  if (!nextLine) return;
  sink?.(nextLine);
  if (typeof window === 'undefined') return;
  const traceWindow = window as BrowserTraceWindow;
  traceWindow.__spCoinRpcFetchTraceBuffer = [...(traceWindow.__spCoinRpcFetchTraceBuffer ?? []), nextLine].slice(-200);
  window.dispatchEvent(new CustomEvent('spcoin-rpc-trace', { detail: { line: nextLine } }));
}

function emitConsoleTrace(kind: 'request' | 'response' | 'error', details: Record<string, unknown>) {
  if (kind === 'error') {
    console.error(`[SPCOIN_RPC_TRACE] browser RPC ${kind}`, details);
    return;
  }
  console.info(`[SPCOIN_RPC_TRACE] browser RPC ${kind}`, details);
}

async function traceRpcTransport<T>({
  url,
  httpMethod,
  body,
  sink,
  transport,
  environment,
  run,
}: {
  url: string;
  httpMethod: string;
  body: unknown | Promise<unknown>;
  sink?: TraceSink;
  transport: 'fetch' | 'ethers-fetch-request';
  environment: 'browser' | 'server';
  run: () => Promise<T>;
}): Promise<T> {
  const startedAt = Date.now();
  const resolvedBody = await body;
  const rpcSummary = summarizeRpcBody(resolvedBody);
  emitSpCoinRpcTrace(
    `[SPCOIN_RPC_TRACE] ${environment} RPC request transport=${transport} method=${rpcSummary.rpcMethod} id=${rpcSummary.rpcId} batch=${String(rpcSummary.rpcBatchSize)} params=${String(rpcSummary.rpcParamsCount)} http=${httpMethod} url=${url}`,
    sink,
  );
  emitConsoleTrace('request', { url, httpMethod, transport, environment, ...rpcSummary, stack: new Error().stack });
  try {
    const result = await run();
    const status = String((result as any)?.status ?? (result as any)?.statusCode ?? '');
    const ok =
      typeof (result as any)?.ok === 'boolean'
        ? String((result as any).ok)
        : status
          ? String(Number(status) >= 200 && Number(status) < 300)
          : '';
    emitSpCoinRpcTrace(
      `[SPCOIN_RPC_TRACE] ${environment} RPC response transport=${transport} method=${rpcSummary.rpcMethod} id=${rpcSummary.rpcId} status=${status} ok=${ok} durationMs=${String(Date.now() - startedAt)}`,
      sink,
    );
    emitConsoleTrace('response', { url, httpMethod, transport, environment, ...rpcSummary, status, ok, durationMs: Date.now() - startedAt });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emitSpCoinRpcTrace(
      `[SPCOIN_RPC_TRACE] ${environment} RPC error transport=${transport} method=${rpcSummary.rpcMethod} id=${rpcSummary.rpcId} durationMs=${String(Date.now() - startedAt)} message=${message}`,
      sink,
    );
    emitConsoleTrace('error', { url, httpMethod, transport, environment, ...rpcSummary, durationMs: Date.now() - startedAt, message });
    throw error;
  }
}

export function installBrowserRpcFetchTracer({
  rpcUrl,
  sink,
}: {
  rpcUrl: string;
  sink?: TraceSink;
}): () => void {
  if (typeof window === 'undefined') return () => {};
  const trimmedRpcUrl = String(rpcUrl || '').trim();
  if (!trimmedRpcUrl) return () => {};
  const traceWindow = window as BrowserTraceWindow;
  const targets = traceWindow.__spCoinRpcFetchTraceTargets ?? new Set<string>();
  targets.add(trimmedRpcUrl);
  traceWindow.__spCoinRpcFetchTraceTargets = targets;

  if (!traceWindow.__spCoinRpcFetchTracePatched) {
    traceWindow.__spCoinRpcFetchTraceOriginal = window.fetch.bind(window);
    traceWindow.__spCoinRpcFetchTracePatched = true;
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : String((input as Request)?.url || '');
      const activeTargets = traceWindow.__spCoinRpcFetchTraceTargets ?? new Set<string>();
      const isWatchedRpc =
        Array.from(activeTargets).some((target) => target && url.startsWith(target)) ||
        SPONSORCOIN_RPC_URL_PATTERN.test(url);
      const originalFetch = traceWindow.__spCoinRpcFetchTraceOriginal!;
      if (!isWatchedRpc || (traceWindow.__spCoinRpcFetchTraceSuppressedDepth ?? 0) > 0) {
        return originalFetch(input, init);
      }
      const httpMethod = String(
        init?.method || (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET'),
      );
      const requestBody =
        init?.body ??
        (typeof Request !== 'undefined' && input instanceof Request
          ? input
              .clone()
              .text()
              .catch(() => '')
          : '');
      return traceRpcTransport({
        url,
        httpMethod,
        body: requestBody,
        sink,
        transport: 'fetch',
        environment: 'browser',
        run: () => originalFetch(input, init),
      });
    }) as typeof window.fetch;
  }

  return () => {
    targets.delete(trimmedRpcUrl);
  };
}

export function createTracedHardhatJsonRpcProvider({
  rpcUrl,
  chainId,
  sink,
  environment = typeof window === 'undefined' ? 'server' : 'browser',
}: {
  rpcUrl: string;
  chainId: number;
  sink?: TraceSink;
  environment?: 'browser' | 'server';
}) {
  const request = new FetchRequest(rpcUrl);
  request.getUrlFunc = (req, signal) =>
    traceRpcTransport({
      url: req.url,
      httpMethod: req.method,
      body: req.body,
      sink,
      transport: 'ethers-fetch-request',
      environment,
      run: async () => {
        if (typeof window === 'undefined') return DEFAULT_GET_URL(req, signal);
        const traceWindow = window as BrowserTraceWindow;
        traceWindow.__spCoinRpcFetchTraceSuppressedDepth = (traceWindow.__spCoinRpcFetchTraceSuppressedDepth ?? 0) + 1;
        try {
          return await DEFAULT_GET_URL(req, signal);
        } finally {
          traceWindow.__spCoinRpcFetchTraceSuppressedDepth = Math.max(
            0,
            (traceWindow.__spCoinRpcFetchTraceSuppressedDepth ?? 1) - 1,
          );
        }
      },
    });
  return new JsonRpcProvider(request, chainId, {
    batchMaxCount: 1,
    staticNetwork: true,
  });
}
