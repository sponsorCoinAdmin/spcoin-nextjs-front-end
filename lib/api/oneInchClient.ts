// File: @/lib/api/oneInchClient.ts
import { getJson } from '@/lib/rest/http';

export type OneInchQuoteParams = {
  chainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  slippage: string;
};

type OneInchClientOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

const API_PROVIDER = '1Inch/';
const QUOTE_PATH = 'quote';

export function getOneInchApiBase(): string {
  const raw = String(process.env.NEXT_PUBLIC_API_SERVER ?? '').trim();
  if (!raw) return '';
  return raw.endsWith('/') ? `${raw}${API_PROVIDER}` : `${raw}/${API_PROVIDER}`;
}

export function getOneInchQuoteUrl(params: OneInchQuoteParams): string | undefined {
  const base = getOneInchApiBase();
  if (!base) return undefined;
  return (
    `${base}${QUOTE_PATH}?chainId=${params.chainId}` +
    `&fromTokenAddress=${params.fromTokenAddress}` +
    `&toTokenAddress=${params.toTokenAddress}` +
    `&amount=${params.amount}` +
    `&fromAddress=${params.fromAddress}` +
    `&slippage=${params.slippage}`
  );
}

export async function getOneInchQuote(
  params: OneInchQuoteParams,
  opts: OneInchClientOptions = {},
): Promise<unknown> {
  const url = getOneInchQuoteUrl(params);
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_SERVER is not configured for 1inch API base');
  }
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
