// File: lib/context/helpers/assetUtils.ts
import type { Address } from 'viem';
import { FEED_TYPE, type WalletAccount } from '@/lib/structure';
import { defaultMissingImage, badTokenAddressImage } from '@/lib/network/utils';

// Minimal client-side existence cache for logo paths
const logoExistenceCache = new Map<string, boolean>();

async function resourceExists(url: string, timeoutMs = 2500): Promise<boolean> {
  // Avoid SSR get; assume assets exist during server render to prevent hydration warnings.
  if (typeof window === 'undefined') return true;
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    let res = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
    clearTimeout(to);
    if (res.ok) return true;
    if (res.status === 405) {
      res = await fetch(url, { method: 'GET', cache: 'no-store' });
      return res.ok;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Resolve an asset logo path and verify existence (client-side).
 * Uses chainId only for building the asset path; does not read network metadata.
 */
export async function getLogoURL(
  chainId: number | undefined,
  address: Address,
  dataFeedType: FEED_TYPE
): Promise<string> {
  const addr = (address ?? '').trim();
  if (!addr) return defaultMissingImage;

  const path =
    dataFeedType === FEED_TYPE.TOKEN_LIST
      ? `/assets/blockchains/${chainId ?? 1}/contracts/${addr}/logo.png`
      : dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS
        ? `/assets/accounts/${addr}/logo.png`
        : '';

  if (!path) return defaultMissingImage;

  if (logoExistenceCache.has(path)) {
    return logoExistenceCache.get(path)! ? path : defaultMissingImage;
  }
  const ok = await resourceExists(path);
  logoExistenceCache.set(path, ok);
  return ok ? path : defaultMissingImage;
}

export type RequiredAssetMembers = { address: string; chainId: number };

export function getTokenLogoURL(required?: RequiredAssetMembers): string {
  if (!required) return badTokenAddressImage;
  const { chainId, address } = required;
  if (typeof address !== 'string' || address.length < 10) return badTokenAddressImage;
  return `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
}

export function getAddressLogoURL(address: string, chainId: number): string {
  if (typeof address === 'string' && address.length > 10) {
    return `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
  }
  return badTokenAddressImage;
}

export function getAccountLogo(account?: WalletAccount): string {
  return account ? `/assets/accounts/${account.address}/logo.png` : defaultMissingImage;
}
