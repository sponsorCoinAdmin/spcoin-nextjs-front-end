// File: @/lib/api/spCoinTokensClient.ts
import { getJson, postJson, HttpError } from '@/lib/rest/http';

const BASE_PATHS = ['/api/spCoin/tokens', '/api/spcoin/tokens'] as const;

type FetchJsonOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

export type TokenApiItem<TData = unknown> = {
  chainId: number;
  address: string;
  data: TData;
};

export type TokensSeedRow = {
  chainId: number;
  address: string;
};

export type TokensPageResponse<TData = unknown> = {
  items: Array<TokenApiItem<TData>>;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type TokensBatchRequest =
  | {
      chainId: number;
      addresses: string[];
    }
  | {
      requests: Array<{ chainId: number; address: string }>;
    };

export type TokensBatchResponse<TData = unknown> = {
  items: Array<TokenApiItem<TData>>;
  countRequested: number;
  countFound: number;
  missing: Array<{ chainId: number; address: string }>;
  invalid: Array<{ chainId?: number; address?: string }>;
};

async function getWithFallback<T>(
  buildUrl: (basePath: string) => string,
  opts: FetchJsonOptions = {},
): Promise<T> {
  let lastErr: unknown;
  for (const basePath of BASE_PATHS) {
    try {
      return await getJson<T>(buildUrl(basePath), {
        timeoutMs: opts.timeoutMs ?? 8000,
        retries: 1,
        accept: 'application/json',
        init: { cache: 'no-store', signal: opts.signal },
        forceParse: true,
      });
    } catch (err) {
      lastErr = err;
      if (!(err instanceof HttpError) || err.status !== 404) throw err;
    }
  }
  throw lastErr ?? new Error('Tokens API GET failed for all base paths');
}

async function postWithFallback<T>(
  buildUrl: (basePath: string) => string,
  body: unknown,
  opts: FetchJsonOptions = {},
): Promise<T> {
  let lastErr: unknown;
  for (const basePath of BASE_PATHS) {
    try {
      return await postJson<T>(buildUrl(basePath), body, {
        timeoutMs: opts.timeoutMs ?? 8000,
        retries: 1,
        accept: 'application/json',
        forceParse: true,
        init: { cache: 'no-store', signal: opts.signal },
      });
    } catch (err) {
      lastErr = err;
      if (!(err instanceof HttpError) || err.status !== 404) throw err;
    }
  }
  throw lastErr ?? new Error('Tokens API POST failed for all base paths');
}

export async function getTokensSeedList(
  chainId: number,
  opts: FetchJsonOptions = {},
): Promise<string[]> {
  return getWithFallback<string[]>(
    (basePath) => `${basePath}?chainId=${chainId}`,
    opts,
  );
}

export async function getTokensSeedListAllNetworks(
  opts: FetchJsonOptions = {},
): Promise<{ items: TokensSeedRow[]; totalItems: number }> {
  return getWithFallback<{ items: TokensSeedRow[]; totalItems: number }>(
    (basePath) => `${basePath}?allNetworks=true`,
    opts,
  );
}

export async function getTokensPage<TData = unknown>(
  page: number,
  pageSize: number,
  opts: FetchJsonOptions & { chainId?: number; allNetworks?: boolean } = {},
): Promise<TokensPageResponse<TData>> {
  const timeoutMs = opts.timeoutMs ?? 20000;
  const scope =
    opts.allNetworks === true
      ? 'allNetworks=true'
      : `chainId=${Number(opts.chainId ?? 0)}`;
  return getWithFallback<TokensPageResponse<TData>>(
    (basePath) =>
      `${basePath}?allData=true&${scope}&page=${page}&pageSize=${pageSize}`,
    { ...opts, timeoutMs },
  );
}

export async function getTokenByAddress<TData = unknown>(
  chainId: number,
  address: string,
  opts: FetchJsonOptions = {},
): Promise<TokenApiItem<TData>> {
  return getWithFallback<TokenApiItem<TData>>(
    (basePath) =>
      `${basePath}/${encodeURIComponent(String(chainId))}/${encodeURIComponent(address)}`,
    opts,
  );
}

export async function getTokensBatch<TData = unknown>(
  payload: TokensBatchRequest,
  opts: FetchJsonOptions = {},
): Promise<TokensBatchResponse<TData>> {
  return postWithFallback<TokensBatchResponse<TData>>(
    (basePath) => basePath,
    payload,
    opts,
  );
}
