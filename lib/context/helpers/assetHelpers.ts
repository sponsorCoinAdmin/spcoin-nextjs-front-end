// File: lib/context/helpers/assetHelpers.ts

import type { Address } from 'viem';
import { FEED_TYPE, type WalletAccount } from '@/lib/structure';
import { headOk, get } from '@/lib/rest/http';

// Minimal client-side existence cache for logo paths
const logoExistenceCache = new Map<string, boolean>();

export const defaultMissingImage =
  '/assets/miscellaneous/QuestionBlackOnRed.png';
export const badTokenAddressImage =
  '/assets/miscellaneous/badTokenAddressImage.png';

async function resourceExists(url: string, timeoutMs = 2500): Promise<boolean> {
  // Avoid SSR get; assume assets exist during server render to prevent hydration warnings.
  if (typeof window === 'undefined') return true;

  // Try a lightweight HEAD first; if a CDN returns 405 for HEAD, fall back to GET.
  const headPass = await headOk(url, {
    timeoutMs,
    retries: 0,
    init: { cache: 'no-store' },
  });
  if (headPass) return true;

  try {
    const res = await get(url, {
      timeoutMs,
      retries: 0,
      init: { cache: 'no-store' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Normalize an address into the canonical filesystem representation used
 * for on-disk directories (wallet.json, logo.png, etc).
 *
 * NEUTRAL MODE (no case changes):
 * - We only trim and basic-length check.
 * - Callers keep their original address casing for now.
 * - Later, if we adopt an UPPERCASE or checksum convention on disk,
 *   we only need to change this helper.
 */
export function normalizeAddressForAssets(address?: string): string {
  if (!address) return '';
  const trimmed = address.trim();
  if (trimmed.length < 10) return '';
  return trimmed;
}

/**
 * Resolve an asset logo path and verify existence (client-side).
 * Uses chainId only for building the asset path; does not read network metadata.
 */
export async function getLogoURL(
  chainId: number | undefined,
  address: Address,
  dataFeedType: FEED_TYPE,
): Promise<string> {
  const addr = (address ?? '').trim();
  if (!addr) return defaultMissingImage;

  // Delegate path construction to the sync helper so types stay in one place.
  const path = getAssetLogoURL(addr, chainId ?? 1, dataFeedType);
  if (!path || path === badTokenAddressImage || path === defaultMissingImage) {
    // No meaningful path to probe; just return the default.
    return defaultMissingImage;
  }

  if (logoExistenceCache.has(path)) {
    return logoExistenceCache.get(path)! ? path : defaultMissingImage;
  }

  const ok = await resourceExists(path);
  logoExistenceCache.set(path, ok);
  return ok ? path : defaultMissingImage;
}

export type RequiredAssetMembers = { address: string; chainId: number };

/**
 * Token-specific logo helper.
 * Returns a contract logo path or the "bad token" sentinel image.
 *
 * NOTE: Address normalization is centralized in `normalizeAddressForAssets`.
 * For now, that helper does NOT change case; it only trims and checks length.
 */
export function getTokenLogoURL(required?: RequiredAssetMembers): string {
  if (!required) return badTokenAddressImage;
  const { chainId, address } = required;

  const normalized = normalizeAddressForAssets(address);
  if (!normalized) return badTokenAddressImage;

  return `/assets/blockchains/${chainId}/contracts/${normalized}/logo.png`;
}

/**
 * Wallet / account-specific logo helper.
 * Uses the accounts logo path and falls back to the generic missing image.
 */
export function getWalletLogoURL(address?: string): string {
  const normalized = normalizeAddressForAssets(address);
  if (!normalized) return defaultMissingImage;
  return `/assets/accounts/${normalized}/logo.png`;
}

/**
 * Network-specific logo helper.
 * Not wired into FEED_TYPE switching yet, but available for network UIs.
 */
export function getNetworkLogoURL(chainId?: number): string {
  if (typeof chainId !== 'number' || !Number.isFinite(chainId)) {
    return defaultMissingImage;
  }
  return `/assets/blockchains/${chainId}/logo.png`;
}

/**
 * Generic asset logo helper that switches based on FEED_TYPE.
 * This is the central place to keep wallet / token / account logo path logic.
 */
export function getAssetLogoURL(
  address: string,
  chainId: number,
  dataFeedType: FEED_TYPE = FEED_TYPE.TOKEN_LIST,
): string {
  if (!address || address.length < 10) {
    // For token feeds, keep using the "bad token" sentinel; for others, use the generic missing image.
    return dataFeedType === FEED_TYPE.TOKEN_LIST
      ? badTokenAddressImage
      : defaultMissingImage;
  }

  switch (dataFeedType) {
    case FEED_TYPE.TOKEN_LIST:
      return getTokenLogoURL({ address, chainId });

    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.AGENT_ACCOUNTS:
      // Recipient/agent feeds are account-style logos.
      return getWalletLogoURL(address);

    default:
      // For unknown feeds, fall back to a token-style path to preserve prior behaviour.
      return getTokenLogoURL({ address, chainId });
  }
}

/**
 * Legacy-style account logo helper (used where a full WalletAccount is available).
 */
export function getAccountLogo(account?: WalletAccount): string {
  if (!account) return defaultMissingImage;
  const normalized = normalizeAddressForAssets(account.address);
  if (!normalized) return defaultMissingImage;
  return `/assets/accounts/${normalized}/logo.png`;
}
