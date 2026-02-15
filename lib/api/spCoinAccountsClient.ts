// File: @/lib/api/spCoinAccountsClient.ts
import { getJson, postJson, HttpError } from '@/lib/rest/http';

const BASE_PATHS = ['/api/spCoin/accounts', '/api/spcoin/accounts'] as const;

type FetchJsonOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

export type AccountApiItem<TData = unknown> = {
  address: string;
  data: TData;
};

export type AccountsPageResponse<TData = unknown> = {
  items: Array<AccountApiItem<TData>>;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type AccountsBatchResponse<TData = unknown> = {
  items: Array<AccountApiItem<TData>>;
  countRequested: number;
  countValid: number;
  countFound: number;
  missing: string[];
  invalid: string[];
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
  throw lastErr ?? new Error('Accounts API GET failed for all base paths');
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
  throw lastErr ?? new Error('Accounts API POST failed for all base paths');
}

export async function getAccountsList(opts: FetchJsonOptions = {}): Promise<string[]> {
  return getWithFallback<string[]>((basePath) => basePath, opts);
}

export async function getAccountsPage<TData = unknown>(
  page: number,
  pageSize: number,
  opts: FetchJsonOptions = {},
): Promise<AccountsPageResponse<TData>> {
  const timeoutMs = opts.timeoutMs ?? 20000;
  return getWithFallback<AccountsPageResponse<TData>>(
    (basePath) => `${basePath}?allData=true&page=${page}&pageSize=${pageSize}`,
    { ...opts, timeoutMs },
  );
}

export async function getAccountByAddress<TData = unknown>(
  address: string,
  opts: FetchJsonOptions = {},
): Promise<AccountApiItem<TData>> {
  return getWithFallback<AccountApiItem<TData>>(
    (basePath) => `${basePath}/${encodeURIComponent(address)}`,
    opts,
  );
}

export async function getAccountsBatch<TData = unknown>(
  addresses: string[],
  opts: FetchJsonOptions = {},
): Promise<AccountsBatchResponse<TData>> {
  return postWithFallback<AccountsBatchResponse<TData>>(
    (basePath) => basePath,
    { addresses },
    opts,
  );
}
