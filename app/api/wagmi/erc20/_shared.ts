// File: app/api/wagmi/erc20/_shared.ts
import { NextResponse } from 'next/server';
import { readContract } from '@wagmi/core';
import { erc20Abi, getAddress } from 'viem';
import { wagmiServerConfig } from '@/lib/wagmi/wagmiServerConfig';

export function getRequiredAddress(url: URL, keys: string[]): string {
  for (const key of keys) {
    const value = (url.searchParams.get(key) ?? '').trim();
    if (value) return getAddress(value);
  }
  throw new Error(`Missing required address param: one of [${keys.join(', ')}]`);
}

export function getOptionalChainId(url: URL): number | undefined {
  const raw = (url.searchParams.get('chainId') ?? '').trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Invalid chainId query param');
  }
  return parsed;
}

export async function readErc20(
  functionName:
    | 'name'
    | 'symbol'
    | 'decimals'
    | 'totalSupply'
    | 'balanceOf'
    | 'allowance',
  tokenAddress: string,
  args: unknown[] = [],
  chainId?: number,
) {
  return readContract(wagmiServerConfig, {
    abi: erc20Abi,
    address: getAddress(tokenAddress),
    functionName,
    args,
    ...(chainId ? { chainId } : {}),
  } as any);
}

export function toJsonSafe(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v)),
  );
}

export function ok(payload: unknown) {
  return NextResponse.json(toJsonSafe(payload), {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function badRequest(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 400, headers: { 'Cache-Control': 'no-store' } },
  );
}
