// File: lib/utils/feeds/assetSelect/builders.ts
'use client';

import type { Address } from 'viem';
import { BURN_ADDRESS } from '@/lib/structure/constants/addresses';
import type { WalletAccount } from '@/lib/structure';
import { FEED_TYPE } from '@/lib/structure';
import {
  getLogoURL,
  getWalletLogoURL,
  getTokenLogoURL,
} from '@/lib/context/helpers/assetHelpers';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';

import type { BuiltToken, FeedData } from './types';

/* ───────────────────────────── utils ───────────────────────────── */

function parseJson(input: unknown): any {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  }
  return input ?? null;
}

/* ─────────────────────── core normalizers (existing) ─────────────────────── */

/** Normalize a sparse account JSON entry into a WalletAccount */
export function buildWalletObj(a: any): WalletAccount {
  const address = (a?.address as Address) || (BURN_ADDRESS as Address);
  return {
    address,
    name: a?.name ?? 'N/A',
    symbol: a?.symbol ?? 'N/A',
    // Always derive; do NOT rely on JSON-provided logoURL
    logoURL: getWalletLogoURL(address),
  } as WalletAccount;
}

/**
 * Normalize a token JSON entry into a BuiltToken (async to resolve logos).
 *
 * IMPORTANT:
 * - `address` is kept in its canonical blockchain form (no uppercasing).
 * - Only the filesystem segment inside `logoURL` is uppercased via
 *   assetHelpers (normalizeAddressForAssets → getTokenLogoURL/getLogoURL).
 */
export async function buildTokenObj(
  t: any,
  chainId: number,
): Promise<BuiltToken> {
  const rawAddress = String(t?.address ?? '').trim();
  const address = rawAddress as Address;

  let logoURL: string;
  try {
    // getLogoURL → getAssetLogoURL → getTokenLogoURL → normalizeAddressForAssets
    // so the directory portion in the final path will be UPPERCASE on disk.
    logoURL = await getLogoURL(chainId, address, FEED_TYPE.TOKEN_LIST);
  } catch {
    // Fallback: derive via central helper instead of hardcoding the path
    logoURL = getTokenLogoURL({ address, chainId });
  }

  return {
    ...t,
    // Keep the on-chain address as provided in JSON (canonical blockchain form)
    address,
    name: t?.name ?? 'Unknown',
    symbol: t?.symbol ?? '—',
    logoURL,
  } as BuiltToken;
}

/* ─────────────────────────── new conveniences ─────────────────────────── */

/**
 * Build a single token from a raw JSON object/string.
 * Example:
 *   await buildTokenFromJson({ symbol: 'USDC', address: '0x...', decimals: 6 }, 1)
 */
export async function buildTokenFromJson(
  rawToken: unknown,
  chainId: number,
): Promise<BuiltToken> {
  return buildTokenObj(parseJson(rawToken), chainId);
}

/**
 * Build one or more wallets from a raw JSON spec.
 * Note: most account specs expand via loadAccounts and may yield multiple entries.
 * Example:
 *   await buildWalletsFromJson({ inline: [{ address: '0xabc...', name: 'My Agent' }] })
 */
export async function buildWalletsFromJson(
  rawAccountSpec: unknown,
): Promise<WalletAccount[]> {
  const accounts = await loadAccounts(parseJson(rawAccountSpec));
  return accounts.map(buildWalletObj);
}

/**
 * Convenience: build exactly one wallet (first) from a spec.
 * Returns null if none resolved.
 */
export async function buildWalletFromJsonFirst(
  rawAccountSpec: unknown,
): Promise<WalletAccount | null> {
  const ws = await buildWalletsFromJson(rawAccountSpec);
  return ws[0] ?? null;
}

/**
 * Feed-style converter: give a JSON (object/string) + FEED_TYPE and get a FeedData bundle.
 * Mirrors the shapes returned by fetchAndBuildDataList, but without going through getDataListObj.
 *
 * TOKEN_LIST:
 *   Accepts a single token object or an array of raw tokens.
 *
 * *_ACCOUNTS:
 *   Accepts the same accounts spec you'd feed into loadAccounts (inline or URL-based), and returns wallets[].
 */
export async function feedDataFromJson(
  feedType: FEED_TYPE,
  chainId: number,
  rawJson: unknown,
): Promise<FeedData> {
  const json = parseJson(rawJson);

  switch (feedType) {
    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.AGENT_ACCOUNTS: {
      const accounts = await loadAccounts(json);
      const wallets = accounts.map(buildWalletObj);
      return { feedType, wallets };
    }

    case FEED_TYPE.TOKEN_LIST: {
      const list = Array.isArray(json) ? json : (json ? [json] : []);
      const tokens = await Promise.all(list.map((t) => buildTokenObj(t, chainId)));
      return { feedType, tokens };
    }

    default: {
      // Keep the union exhaustive by returning an empty token list.
      // If you prefer strictness: throw new Error(`Unsupported feedType: ${feedType}`)
      return { feedType: FEED_TYPE.TOKEN_LIST, tokens: [] };
    }
  }
}
