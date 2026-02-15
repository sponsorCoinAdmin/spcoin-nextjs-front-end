// File: @/lib/api/nativeTokenClient.ts
import { getJson } from '@/lib/rest/http';

export type NativeTokenMeta = {
  name: string;
  symbol: string;
  decimals: number;
};

type NativeTokenClientOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

export async function getNativeTokenMeta(
  chainId: number,
  opts: NativeTokenClientOptions = {},
): Promise<NativeTokenMeta> {
  const url = `/api/native-token/${chainId}`;
  return getJson<NativeTokenMeta>(url, {
    timeoutMs: opts.timeoutMs ?? 6000,
    retries: 1,
    accept: 'application/json',
    forceParse: true,
    init: {
      cache: 'no-store',
      signal: opts.signal,
    },
  });
}
