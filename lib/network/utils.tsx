// File: lib/network/utils.tsx

import { useExchangeContext } from '@/lib/context/hooks';
import type { Address } from 'viem';
import type {
  ExchangeContext,
  TokenContract,
  TradeData,
  WalletAccount,
} from '@/lib/structure';
import { FEED_TYPE } from '@/lib/structure';
import { isAddress, getAddress } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { headOk } from '@/lib/rest/http';
import {
  NATIVE_TOKEN_ADDRESS,
  BURN_ADDRESS,
} from '../structure/constants/addresses';

// Debug logging
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_UTILS === 'true';
const debugLog = createDebugLogger('NetworkUtils', DEBUG_ENABLED, LOG_TIME);

/* ───────── Asset/logo utilities (no network metadata) ───────── */

export const defaultMissingImage =
  '/assets/miscellaneous/QuestionBlackOnRed.png';
export const badTokenAddressImage =
  '/assets/miscellaneous/badTokenAddressImage.png';

// Minimal client-side existence cache for logo paths
const logoExistenceCache = new Map<string, boolean>();

async function resourceExists(url: string, timeoutMs = 2500): Promise<boolean> {
  // Avoid SSR get; assume assets exist during server render to prevent hydration warnings.
  if (typeof window === 'undefined') return true;

  // Fast HEAD probe using REST helper (treats 2xx/3xx as pass).
  const ok = await headOk(url, {
    timeoutMs,
    retries: 0,
    init: { cache: 'no-store' },
  });

  return ok;
}

/**
 * Resolve an asset logo path and verify existence (client-side).
 * Uses chainId only for building the asset path; does not read network metadata.
 * IMPORTANT: Production hosting is case-sensitive, so we must use EIP-55 checksummed casing.
 */
export const getLogoURL = async (
  chainId: number | undefined,
  address: Address,
  dataFeedType: FEED_TYPE,
): Promise<string> => {
  const raw = (address ?? '').trim();
  if (!raw) return defaultMissingImage;

  // Enforce EIP-55 checksum casing so paths match case-sensitive files on Linux.
  const addr = isAddress(raw)
    ? (getAddress(raw) as Address)
    : (raw as Address);

  const path =
    dataFeedType === FEED_TYPE.TOKEN_LIST
      ? `/assets/blockchains/${chainId ?? 1}/contracts/${addr}/logo.png`
      : dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS ||
          dataFeedType === FEED_TYPE.AGENT_ACCOUNTS
        ? `/assets/accounts/${addr}/logo.png`
        : '';

  if (!path) return defaultMissingImage;

  if (logoExistenceCache.has(path)) {
    return logoExistenceCache.get(path)! ? path : defaultMissingImage;
  }

  const ok = await resourceExists(path);
  logoExistenceCache.set(path, ok);
  return ok ? path : defaultMissingImage;
};

export type RequiredAssetMembers = { address: string; chainId: number };

export const getTokenLogoURL = (
  requiredAssetMembers?: RequiredAssetMembers,
): string => {
  if (!requiredAssetMembers || !isAddress(requiredAssetMembers.address)) {
    return badTokenAddressImage;
  }
  const { chainId, address } = requiredAssetMembers;
  const checksummed = getAddress(address);
  const logoURL = `/assets/blockchains/${chainId}/contracts/${checksummed}/logo.png`;
  debugLog.log?.(`getTokenLogoURL.logoURL=${logoURL}`);
  return logoURL;
};

export const getAddressLogoURL = (
  address: string,
  chainId: number,
): string => {
  if (isAddress(address)) {
    const checksummed = getAddress(address);
    const logoURL = `/assets/blockchains/${chainId}/contracts/${checksummed}/logo.png`;
    debugLog.log?.(`getAddressLogoURL.logoURL=${logoURL}`);
    return logoURL;
  }
  return badTokenAddressImage;
};

export const getAccountLogo = (account?: WalletAccount): string => {
  if (!account) return defaultMissingImage;
  const addr = account.address;
  const checksummed = isAddress(addr) ? getAddress(addr) : addr;
  return `/assets/accounts/${checksummed}/logo.png`;
};

/* ───────── Active connected-account / token helpers (no network metadata) ───────── */

export const isActiveAccountAddress = (
  exchangeContext: ExchangeContext,
  address?: Address,
) =>
  address
    ? address === exchangeContext?.accounts?.activeAccount?.address
    : false;

export const isActiveAccountToken = (
  exchangeContext: ExchangeContext,
  tokenContract: TokenContract,
) => isActiveAccountAddress(exchangeContext, tokenContract.address);

export const isActiveAccountSellToken = (
  exchangeContext: ExchangeContext,
): boolean =>
  !!exchangeContext?.tradeData?.sellTokenContract &&
  isActiveAccountToken(
    exchangeContext,
    exchangeContext.tradeData.sellTokenContract,
  );

export const isActiveAccountBuyToken = (
  exchangeContext: ExchangeContext,
): boolean =>
  !!exchangeContext?.tradeData?.buyTokenContract &&
  isActiveAccountToken(
    exchangeContext,
    exchangeContext.tradeData.buyTokenContract,
  );

export const isNativeTokenAddress = (address?: Address): boolean =>
  address === NATIVE_TOKEN_ADDRESS;

export const isNativeToken = (tokenContract: TokenContract): boolean =>
  isNativeTokenAddress(tokenContract.address);

export const isNativeSellToken = (tradeData: TradeData): boolean =>
  !!tradeData.sellTokenContract && isNativeToken(tradeData.sellTokenContract);

export const isNativeBuyToken = (tradeData: TradeData): boolean =>
  !!tradeData.buyTokenContract && isNativeToken(tradeData.buyTokenContract);

export const isBurnTokenAddress = (address?: Address): boolean =>
  address === BURN_ADDRESS;

export const isBurnToken = (tokenContract: TokenContract): boolean =>
  !!tokenContract?.address && isBurnTokenAddress(tokenContract.address);

/* ───────── Hooks / misc utilities (no network metadata) ───────── */

export const useIsActiveAccountAddress = (address?: Address): boolean => {
  const { exchangeContext } = useExchangeContext();
  return isActiveAccountAddress(exchangeContext, address);
};

export const isLowerCase = (input: string): boolean =>
  input === input.toLowerCase();

export function delay(ms: number | undefined) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
