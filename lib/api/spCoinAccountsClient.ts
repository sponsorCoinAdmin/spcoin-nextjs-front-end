// File: @/lib/api/spCoinAccountsClient.ts
import { getJson, postJson } from '@/lib/rest/http';

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
  return postJson<AccountsBatchResponse<TData>>(
    BASE_PATH,
    { addresses },
    {
      timeoutMs: opts.timeoutMs ?? 8000,
      retries: 1,
      accept: 'application/json',
      forceParse: true,
      init: { cache: 'no-store', signal: opts.signal },
    },
  );
}
