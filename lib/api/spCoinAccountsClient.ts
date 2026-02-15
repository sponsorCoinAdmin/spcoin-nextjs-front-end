// File: @/lib/api/spCoinAccountsClient.ts
import { getJson } from '@/lib/rest/http';

const BASE_PATH = '/api/spCoin/accounts';

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

function withTimeoutSignal(timeoutMs = 8000, externalSignal?: AbortSignal) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) ctrl.abort();
    else externalSignal.addEventListener('abort', () => ctrl.abort(), { once: true });
  }

  return {
    signal: ctrl.signal,
    clear: () => clearTimeout(timer),
  };
}

async function fetchJson<T>(
  url: string,
  init: RequestInit,
  opts: FetchJsonOptions = {},
): Promise<T> {
  const { signal, clear } = withTimeoutSignal(opts.timeoutMs ?? 8000, opts.signal);
  try {
    const res = await fetch(url, { ...init, signal });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${init.method ?? 'GET'} ${url} failed: ${res.status} ${res.statusText} ${body}`.trim());
    }
    return (await res.json()) as T;
  } finally {
    clear();
  }
}

export async function getAccountsList(opts: FetchJsonOptions = {}): Promise<string[]> {
  return getJson<string[]>(BASE_PATH, {
    timeoutMs: opts.timeoutMs ?? 8000,
    retries: 1,
    accept: 'application/json',
    init: { cache: 'no-store', signal: opts.signal },
    forceParse: true,
  });
}

export async function getAccountsPage<TData = unknown>(
  page: number,
  pageSize: number,
  opts: FetchJsonOptions = {},
): Promise<AccountsPageResponse<TData>> {
  const url = `${BASE_PATH}?allData=true&page=${page}&pageSize=${pageSize}`;
  return getJson<AccountsPageResponse<TData>>(url, {
    timeoutMs: opts.timeoutMs ?? 8000,
    retries: 1,
    accept: 'application/json',
    init: { cache: 'no-store', signal: opts.signal },
    forceParse: true,
  });
}

export async function getAccountByAddress<TData = unknown>(
  address: string,
  opts: FetchJsonOptions = {},
): Promise<AccountApiItem<TData>> {
  const url = `${BASE_PATH}/${encodeURIComponent(address)}`;
  return getJson<AccountApiItem<TData>>(url, {
    timeoutMs: opts.timeoutMs ?? 8000,
    retries: 0,
    accept: 'application/json',
    init: { cache: 'no-store', signal: opts.signal },
    forceParse: true,
  });
}

export async function getAccountsBatch<TData = unknown>(
  addresses: string[],
  opts: FetchJsonOptions = {},
): Promise<AccountsBatchResponse<TData>> {
  return fetchJson<AccountsBatchResponse<TData>>(
    BASE_PATH,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({ addresses }),
    },
    opts,
  );
}
