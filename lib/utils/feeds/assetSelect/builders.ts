'use client';

import type { Address } from 'viem';
import { BURN_ADDRESS } from '@/lib/structure/constants/addresses';
import type { spCoinAccount } from '@/lib/structure';
import { FEED_TYPE } from '@/lib/structure';
import {
  getLogoURL,
  getWalletLogoURL,
  getTokenLogoURL,
} from '@/lib/context/helpers/assetHelpers';

import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import type { BuiltToken, FeedData } from './types';

/* ───────────────────────────── debug ───────────────────────────── */

const LOG_TIME = false as const;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('assetSelect.builders', DEBUG_ENABLED, LOG_TIME);

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

/* ─────────────────────── core normalizers ─────────────────────── */

/** Normalize a sparse account JSON entry into a spCoinAccount */
export function buildWalletObj(a: any): spCoinAccount {
  const address = (a?.address as Address) || (BURN_ADDRESS as Address);
  return {
    address,
    name: a?.name ?? 'N/A',
    symbol: a?.symbol ?? 'N/A',
    // Always derive; do NOT rely on JSON-provided logoURL
    logoURL: getWalletLogoURL(address),
  } as spCoinAccount;
}

/** Normalize a token JSON entry into a BuiltToken (async to resolve logos) */
export async function buildTokenObj(t: any, chainId: number): Promise<BuiltToken> {
  const address = String(t?.address ?? '').toLowerCase();
  let logoURL: string;
  try {
    logoURL = await getLogoURL(chainId, address as any, FEED_TYPE.TOKEN_LIST);
  } catch {
    // Fallback: derive via central helper instead of hardcoding the path
    logoURL = getTokenLogoURL({ address, chainId });
  }

  return {
    ...t,
    address,
    name: t?.name ?? 'Unknown',
    symbol: t?.symbol ?? '—',
    logoURL,
  } as BuiltToken;
}

/* ─────────────────────────── new conveniences ─────────────────────────── */

export async function buildTokenFromJson(rawToken: unknown, chainId: number): Promise<BuiltToken> {
  return buildTokenObj(parseJson(rawToken), chainId);
}

export async function buildWalletsFromJson(rawAccountSpec: unknown): Promise<spCoinAccount[]> {
  const spec = parseJson(rawAccountSpec);

  // ✅ This is the “before we go to public/assets/accounts” log.
  // We log the exact spec being passed into loadAccounts().
  debugLog.log?.('[buildWalletsFromJson] calling loadAccounts(spec)', {
    specType: typeof spec,
    isArray: Array.isArray(spec),
    keys: spec && typeof spec === 'object' && !Array.isArray(spec) ? Object.keys(spec).slice(0, 20) : undefined,
    preview: Array.isArray(spec) ? spec.slice(0, 3) : spec,
  });

  const accounts = await loadAccounts(spec);
  debugLog.log?.('[buildWalletsFromJson] loadAccounts returned', {
    count: accounts.length,
    sample: accounts.slice(0, 3).map((a) => a.address),
  });

  return accounts.map(buildWalletObj);
}

export async function buildWalletFromJsonFirst(rawAccountSpec: unknown): Promise<spCoinAccount | null> {
  const ws = await buildWalletsFromJson(rawAccountSpec);
  return ws[0] ?? null;
}

/**
 * Feed-style converter: give a JSON (object/string) + FEED_TYPE and get a FeedData bundle.
 */
export async function feedDataFromJson(feedType: FEED_TYPE, chainId: number, rawJson: unknown): Promise<FeedData> {
  const json = parseJson(rawJson);

  debugLog.log?.('[feedDataFromJson] start', {
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    jsonKind: Array.isArray(json) ? 'array' : typeof json,
    jsonPreview: Array.isArray(json) ? json.slice(0, 3) : json,
  });

  switch (feedType) {
    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.AGENT_ACCOUNTS:
    case FEED_TYPE.SPONSOR_ACCOUNTS:
    case FEED_TYPE.MANAGE_RECIPIENTS:
    case FEED_TYPE.MANAGE_AGENTS: {
      const accounts = await loadAccounts(json);
      const wallets = accounts.map(buildWalletObj);

      debugLog.log?.('[feedDataFromJson] built wallets', {
        feedTypeLabel: FEED_TYPE[feedType],
        walletsLen: wallets.length,
        sample: wallets.slice(0, 3).map((w) => w.address),
      });

      return { feedType: feedType as any, wallets };
    }

    case FEED_TYPE.TOKEN_LIST: {
      const list = Array.isArray(json) ? json : (json ? [json] : []);
      const tokens = await Promise.all(list.map((t) => buildTokenObj(t, chainId)));

      debugLog.log?.('[feedDataFromJson] built tokens', {
        tokensLen: tokens.length,
        sample: tokens.slice(0, 3).map((t) => t.address),
      });

      return { feedType: FEED_TYPE.TOKEN_LIST, tokens };
    }

    default: {
      debugLog.warn?.('[feedDataFromJson] unsupported feedType -> returning empty', {
        feedType,
        feedTypeLabel: FEED_TYPE[feedType],
      });
      return { feedType: FEED_TYPE.TOKEN_LIST, tokens: [] };
    }
  }
}
