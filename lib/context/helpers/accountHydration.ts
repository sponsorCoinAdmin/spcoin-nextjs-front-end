// File: @/lib/context/helpers/accountHydration.ts
'use client';

import type { Address } from 'viem';
import { isAddress } from 'viem';
import type { spCoinAccount } from '@/lib/structure';
import { STATUS } from '@/lib/structure';
import { getJson } from '@/lib/rest/http';
import { getWalletJsonURL, getWalletLogoURL, defaultMissingImage } from '@/lib/context/helpers/assetHelpers';

type WalletJson = Partial<spCoinAccount> & {
  balance?: string | number | bigint;
  status?: unknown; // wallet.json may store string values
};

type HydrateOpts = {
  /** If provided, overrides/merges balance (eg from wagmi). */
  balance?: bigint;
  /**
   * If true, uses json.logoURL when present (not recommended).
   * Default false: always derive via getWalletLogoURL().
   */
  allowJsonLogoURL?: boolean;
  /** Optional override for fallback status when metadata missing. */
  fallbackStatus?: STATUS;
};

/* ----------------------------- small utils ----------------------------- */

function isProbablyClient() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function toBigIntSafe(value: unknown): bigint {
  try {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value));
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return BigInt(trimmed);
      if (/^-?\d+$/.test(trimmed)) return BigInt(trimmed);
    }
  } catch {
    /* ignore */
  }
  return 0n;
}

function coerceStatus(raw: unknown): STATUS {
  // If wallet.json stores the exact enum value, accept it.
  if (typeof raw === 'string') {
    const v = raw as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (Object.values(STATUS as any).includes(v)) return v as STATUS;
  }
  return STATUS.INFO;
}

/** Consistent fallback shape for "not registered / missing wallet.json". */
export function makeWalletFallback(
  addr: Address,
  status: STATUS,
  description: string,
  balance?: bigint,
): spCoinAccount {
  return {
    address: addr,
    type: 'ERC20_WALLET',
    name: '',
    symbol: '',
    website: '',
    status,
    description,
    logoURL: getWalletLogoURL(addr) || defaultMissingImage,
    balance: typeof balance === 'bigint' ? balance : 0n,
  };
}

/* ----------------------------- main SSOT ----------------------------- */

/**
 * ✅ SSOT: Hydrate a full spCoinAccount from `/public/assets/accounts/<ADDR>/wallet.json`.
 *
 * Rules:
 * - Reads wallet.json via getWalletJsonURL()
 * - Always derives logoURL via getWalletLogoURL() (unless allowJsonLogoURL)
 * - Preserves/overrides balance if opts.balance is provided
 * - Returns a complete spCoinAccount suitable for ExchangeContext.accounts.activeAccount
 */
export async function hydrateAccountFromAddress(
  address: Address,
  opts: HydrateOpts = {},
): Promise<spCoinAccount> {
  const addr = (address ?? '').trim() as Address;

  if (!addr || !isAddress(addr)) {
    // Unknown / invalid address
    return makeWalletFallback(
      (addr || ('0x0000000000000000000000000000000000000000' as Address)) as Address,
      opts.fallbackStatus ?? STATUS.MESSAGE_ERROR,
      'Invalid wallet address',
      opts.balance,
    );
  }

  // Avoid SSR fetches (and hydration mismatch). Caller should re-run on client anyway.
  if (!isProbablyClient()) {
    return makeWalletFallback(
      addr,
      opts.fallbackStatus ?? STATUS.INFO,
      'Wallet metadata available on client only',
      opts.balance,
    );
  }

  const url = getWalletJsonURL(addr);

  let json: WalletJson | undefined;
  try {
    json = await getJson<WalletJson>(url, {
      timeoutMs: 6000,
      retries: 1,
      accept: 'application/json',
      init: { cache: 'no-store' },
      forceParse: true,
    });
  } catch {
    return makeWalletFallback(
      addr,
      opts.fallbackStatus ?? STATUS.MESSAGE_ERROR,
      `Account ${addr} not registered on this site`,
      opts.balance,
    );
  }

  const balance =
    typeof opts.balance === 'bigint' ? opts.balance : toBigIntSafe(json?.balance);

  // Default: always derive logoURL (filesystem convention)
  const derivedLogo = getWalletLogoURL(addr) || defaultMissingImage;
  const logoURL =
    opts.allowJsonLogoURL && typeof json?.logoURL === 'string' && json.logoURL.trim().length
      ? String(json.logoURL)
      : derivedLogo;

  return {
    address: addr,
    type: typeof json?.type === 'string' ? json.type : 'ERC20_WALLET',
    name: typeof json?.name === 'string' ? json.name : '',
    symbol: typeof json?.symbol === 'string' ? json.symbol : '',
    website: typeof json?.website === 'string' ? json.website : '',
    description: typeof json?.description === 'string' ? json.description : '',
    status: coerceStatus(json?.status),
    logoURL,
    balance,
  };
}
