// File: @/lib/api/zeroXClient.ts
import { stringify } from 'qs';
import { getJson } from '@/lib/rest/http';
import type { PriceRequestParams } from '@/lib/structure';

type ZeroXClientOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

function compactParams(params: PriceRequestParams): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
}

export async function getZeroXPrice(
  params: PriceRequestParams,
  opts: ZeroXClientOptions = {},
): Promise<unknown> {
  const query = stringify(compactParams(params));
  const url = `/api/0x/price?${query}`;
  return getJson<unknown>(url, {
    timeoutMs: opts.timeoutMs ?? 10000,
    retries: 1,
    accept: 'application/json',
    init: {
      cache: 'no-store',
      signal: opts.signal,
    },
  });
}
