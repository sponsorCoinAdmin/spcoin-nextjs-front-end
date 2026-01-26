// File: @/lib/context/helpers/assetHelpers.ts

import type { Address } from 'viem';
import { FEED_TYPE, type spCoinAccount } from '@/lib/structure';
import { headOk, get } from '@/lib/rest/http';

// Minimal client-side existence cache for logo paths
const logoExistenceCache = new Map<string, boolean>();

// Minimal client-side existence cache for info.json paths
const infoExistenceCache = new Map<string, boolean>();

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
 * NOTE:
 * - We deliberately do NOT mutate any upstream state; callers should keep
 *   their canonical `address` value for API / RPC usage.
 * - This helper is the single source of truth for case handling when
 *   building `/assets/accounts/...` and related paths.
 */
export function normalizeAddressForAssets(address?: string): string {
  if (!address) return '';
  const trimmed = address.trim();
  if (trimmed.length < 10) return '';

  // Your filesystem convention: EVERYTHING UPPERCASE, including 0X
  return trimmed.toUpperCase();
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

/**
 * Resolve an asset info.json path and verify existence (client-side).
 * Uses chainId only for building the asset path; does not read network metadata.
 *
 * Returns:
 *   - the info.json path if it exists
 *   - '' (empty string) if it does not exist or cannot be probed
 */
export async function getInfoURL(
  chainId: number | undefined,
  address: Address,
  dataFeedType: FEED_TYPE,
): Promise<string> {
  const addr = (address ?? '').trim();
  if (!addr) return '';

  const path = getAssetInfoURL(addr, chainId ?? 1, dataFeedType);
  if (!path) return '';

  if (infoExistenceCache.has(path)) {
    return infoExistenceCache.get(path)! ? path : '';
  }

  const ok = await resourceExists(path);
  infoExistenceCache.set(path, ok);
  return ok ? path : '';
}

export type RequiredAssetMembers = { address: string; chainId: number };

/**
 * Contract root helper for on-disk storage.
 * Example: /assets/blockchains/1/contracts/0XABC...123
 */
export function getContractRoot(chainId: number, address?: string): string {
  const normalized = normalizeAddressForAssets(address);
  if (!normalized) return '';
  return `/assets/blockchains/${chainId}/contracts/${normalized}`;
}

/**
 * Wallet root helper for on-disk storage.
 * Example: /assets/accounts/0XABC...123
 */
export function getWalletRoot(address?: string): string {
  const normalized = normalizeAddressForAssets(address);
  if (!normalized) return '';
  return `/assets/accounts/${normalized}`;
}

/**
 * Token-specific logo helper.
 * Returns a contract logo path or the "bad token" sentinel image.
 *
 * NOTE: We normalize the address for filesystem paths via
 * `normalizeAddressForAssets` so that Linux case-sensitivity matches our
 * on-disk directory names.
 */
export function getTokenLogoURL(required?: RequiredAssetMembers): string {
  if (!required) return badTokenAddressImage;
  const { chainId, address } = required;

  const root = getContractRoot(chainId, address);
  if (!root) return badTokenAddressImage;

  return `${root}/logo.png`;
}

/**
 * Wallet / account-specific logo helper.
 * Uses the accounts logo path and falls back to the generic missing image.
 */
export function getWalletLogoURL(address?: string): string {
  const root = getWalletRoot(address);
  if (!root) return defaultMissingImage;
  return `${root}/logo.png`;
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
 *
 * NOTE:
 * - We normalize the address for filesystem paths up front, so all feeds
 *   (token, recipient, agent) share the same casing rules.
 */
export function getAssetLogoURL(
  address: string,
  chainId: number,
  dataFeedType: FEED_TYPE = FEED_TYPE.TOKEN_LIST,
): string {
  const normalized = normalizeAddressForAssets(address);
  if (!normalized) {
    // For token feeds, keep using the "bad token" sentinel; for others, use the generic missing image.
    return dataFeedType === FEED_TYPE.TOKEN_LIST
      ? badTokenAddressImage
      : defaultMissingImage;
  }

  switch (dataFeedType) {
    case FEED_TYPE.TOKEN_LIST:
      // Token logos live under /assets/blockchains/<chainId>/contracts/<0X...>/logo.png
      return getTokenLogoURL({ address: normalized, chainId });

    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.AGENT_ACCOUNTS:
      // Recipient/agent feeds are account-style logos under /assets/accounts/<0X...>/logo.png
      return getWalletLogoURL(normalized);

    default:
      // For unknown feeds, fall back to a token-style path to preserve prior behaviour.
      return getTokenLogoURL({ address: normalized, chainId });
  }
}

/**
 * Generic asset info helper that switches based on FEED_TYPE.
 * Builds a path ending in /info.json instead of /logo.png.
 *
 * NOTE:
 * - We normalize the address once up front so both token and account
 *   info paths follow the same casing rules as the logo helpers.
 */
export function getAssetInfoURL(
  address: string,
  chainId: number,
  dataFeedType: FEED_TYPE = FEED_TYPE.TOKEN_LIST,
): string {
  const normalized = normalizeAddressForAssets(address);
  if (!normalized) {
    return '';
  }

  switch (dataFeedType) {
    case FEED_TYPE.TOKEN_LIST: {
      const root = getContractRoot(chainId, normalized);
      return root ? `${root}/info.json` : '';
    }

    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.AGENT_ACCOUNTS: {
      const root = getWalletRoot(normalized);
      return root ? `${root}/info.json` : '';
    }

    default: {
      const root = getContractRoot(chainId, normalized);
      return root ? `${root}/info.json` : '';
    }
  }
}

/**
 * Legacy-style account logo helper (used where a full spCoinAccount is available).
 * Delegates to the wallet logo helper so account logos share the same behavior.
 */
export function getAccountLogo(account?: spCoinAccount): string {
  if (!account) return defaultMissingImage;
  return getWalletLogoURL(account.address);
}

/**
 * Helper for the account metadata JSON (wallet.json) path.
 *
 * All callers that need `/assets/accounts/<addr>/wallet.json` should use this
 * so that directory case stays consistent across the app.
 */
export function getWalletJsonURL(address?: string): string {
  const root = getWalletRoot(address);
  if (!root) return '';
  return `${root}/wallet.json`;
}

/**
 * Helper for account metadata JSON when a spCoinAccount object is available.
 */
export function getAccountWalletJsonURL(account?: spCoinAccount): string {
  if (!account) return '';
  return getWalletJsonURL(account.address);
}

/**
 * Base URL for the site-info helper page.
 * This remains a static path; address-specific variants should be built with
 * `getSiteInfoURLForAddress`.
 */
export function getSiteInfoBaseURL(): string {
  return '/assets/accounts/site-info.html';
}

/**
 * Site-info URL that includes a siteKey query parameter derived from the
 * canonical address. This is used by RecipientSite to embed the recipient's
 * external website via the static helper page.
 */
export function getSiteInfoURLForAddress(address?: string): string {
  const base = getSiteInfoBaseURL();
  const normalized = normalizeAddressForAssets(address);
  if (!normalized) return base;
  const encoded = encodeURIComponent(normalized);
  return `${base}?siteKey=${encoded}`;
}
