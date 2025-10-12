// File: lib/utils/feeds/assetSelect/builders.ts
'use client';

import type { Address } from 'viem';
import { BURN_ADDRESS } from '@/lib/structure/constants/addresses';
import { FEED_TYPE, WalletAccount } from '@/lib/structure';
import { getLogoURL } from '@/lib/network/utils';
import type { BuiltToken } from './types';

/** Normalize a sparse account JSON entry into a WalletAccount */
export function buildWalletObj(a: any): WalletAccount {
  const address = (a?.address as Address) || (BURN_ADDRESS as Address);
  return {
    address,
    name: a?.name ?? 'N/A',
    symbol: a?.symbol ?? 'N/A',
    // Always derive; do NOT rely on JSON-provided logoURL
    logoURL: `/assets/accounts/${address}/logo.png`,
  } as WalletAccount;
}

/** Normalize a token JSON entry into a BuiltToken (async to resolve logos) */
export async function buildTokenObj(t: any, chainId: number): Promise<BuiltToken> {
  const address = String(t?.address ?? '').toLowerCase();
  let logoURL: string;
  try {
    logoURL = await getLogoURL(chainId, address as any, FEED_TYPE.TOKEN_LIST);
  } catch {
    logoURL = `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
  }
  return {
    ...t,
    address,
    name: t?.name ?? 'Unknown',
    symbol: t?.symbol ?? '—',
    logoURL,
  } as BuiltToken;
}
