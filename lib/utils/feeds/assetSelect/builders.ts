// File: lib/utils/feeds/assetSelect/builders.ts
'use client';

import { FEED_TYPE, WalletAccount, BURN_ADDRESS } from '@/lib/structure';
import type { Address } from 'viem';
import { getLogoURL } from '@/lib/network/utils';

export function buildWalletObj(raw: WalletAccount): WalletAccount {
  const address = (raw.address as Address) || (BURN_ADDRESS as Address);
  return {
    ...raw,
    address,
    name: raw.name || 'N/A',
    symbol: raw.symbol || 'N/A',
    // Always derive; do not trust JSON-provided logos
    logoURL: `/assets/accounts/${address}/logo.png`,
  };
}

export async function buildTokenObj(raw: any, chainId: number): Promise<any> {
  const address = raw.address as Address;
  try {
    const logoURL = await getLogoURL(chainId, address, FEED_TYPE.TOKEN_LIST);
    return { ...raw, logoURL };
  } catch {
    return {
      ...raw,
      logoURL: `/assets/blockchains/${chainId}/contracts/${address}/logo.png`,
    };
  }
}
