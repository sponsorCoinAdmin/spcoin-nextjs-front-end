// File: lib/network/utils.tsx

import { useExchangeContext } from '@/lib/context/hooks';
import type { Address } from 'viem';
import {
  ExchangeContext,
  FEED_TYPE,
  TokenContract,
  TradeData,
  WalletAccount,
} from '@/lib/structure';
import { isAddress } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// Debug logging
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_UTILS === 'true';
const debugLog = createDebugLogger('ExchangeButton', DEBUG_ENABLED, LOG_TIME);

/* ───────── Asset/logo utilities (no network metadata) ───────── */

const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';
const badTokenAddressImage = '/assets/miscellaneous/badTokenAddressImage.png';

const logoExistenceCache = new Map<string, boolean>();

async function resourceExists(url: string, timeoutMs = 2500): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    let res = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
    clearTimeout(t);
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
const getLogoURL = async (
  chainId: number | undefined,
  address: Address,
  dataFeedType: FEED_TYPE
): Promise<string> => {
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
};

type RequiredAssetMembers = { address: string; chainId: number };

const getTokenLogoURL = (requiredAssetMembers?: RequiredAssetMembers): string => {
  if (!requiredAssetMembers || !isAddress(requiredAssetMembers.address)) {
    return badTokenAddressImage;
  }
  const { chainId, address } = requiredAssetMembers;
  const logoURL = `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
  debugLog.log(`getTokenLogoURL.logoURL=${logoURL}`);
  return logoURL;
};

const getAddressLogoURL = (address: string, chainId: number): string => {
  if (isAddress(address)) {
    const logoURL = `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
    debugLog.log(`getAddressLogoURL.logoURL=${logoURL}`);
    return logoURL;
  }
  return badTokenAddressImage;
};

const getAccountLogo = (account?: WalletAccount): string =>
  account ? `/assets/accounts/${account.address}/logo.png` : defaultMissingImage;

/* ───────── Active account / token helpers (no network metadata) ───────── */

const BURN_ADDRESS: Address  = '0x0000000000000000000000000000000000000000';
const NATIVE_TOKEN_ADDRESS: Address = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const isActiveAccountAddress = (exchangeContext: ExchangeContext, address?: Address) =>
  address ? address === exchangeContext?.accounts?.connectedAccount?.address : false;

const isActiveAccountToken = (exchangeContext: ExchangeContext, tokenContract: TokenContract) =>
  isActiveAccountAddress(exchangeContext, tokenContract.address);

const isActiveAccountSellToken = (exchangeContext: ExchangeContext): boolean =>
  !!exchangeContext?.tradeData?.sellTokenContract &&
  isActiveAccountToken(exchangeContext, exchangeContext.tradeData.sellTokenContract);

const isActiveAccountBuyToken = (exchangeContext: ExchangeContext): boolean =>
  !!exchangeContext?.tradeData?.buyTokenContract &&
  isActiveAccountToken(exchangeContext, exchangeContext.tradeData.buyTokenContract);

const isNativeTokenAddress = (address?: Address): boolean =>
  address === NATIVE_TOKEN_ADDRESS;

const isNativeToken = (tokenContract: TokenContract): boolean =>
  isNativeTokenAddress(tokenContract.address);

const isNativeSellToken = (tradeData: TradeData): boolean =>
  !!tradeData.sellTokenContract && isNativeToken(tradeData.sellTokenContract);

const isNativeBuyToken = (tradeData: TradeData): boolean =>
  !!tradeData.buyTokenContract && isNativeToken(tradeData.buyTokenContract);

const isBurnTokenAddress = (address?: Address): boolean =>
  address === BURN_ADDRESS;

const isBurnToken = (tokenContract: TokenContract): boolean =>
  !!tokenContract?.address && isBurnTokenAddress(tokenContract.address);

/* ───────── Hooks / misc utilities (no network metadata) ───────── */

const useIsActiveAccountAddress = (address?: Address): boolean => {
  const { exchangeContext } = useExchangeContext();
  return isActiveAccountAddress(exchangeContext, address);
};

const isLowerCase = (input: string): boolean => input === input.toLowerCase();

function delay(ms: number | undefined) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const tokenContractsEqual = (a?: TokenContract, b?: TokenContract): boolean =>
  a?.address === b?.address && a?.symbol === b?.symbol && a?.decimals === b?.decimals;

/* ───────── Exports ───────── */

export {
  type RequiredAssetMembers,
  BURN_ADDRESS,
  NATIVE_TOKEN_ADDRESS,
  badTokenAddressImage,
  defaultMissingImage,
  delay,
  getLogoURL,
  getTokenLogoURL,
  getAccountLogo,
  getAddressLogoURL,
  isActiveAccountAddress,
  isActiveAccountBuyToken,
  isActiveAccountSellToken,
  isActiveAccountToken,
  isBurnTokenAddress,
  isLowerCase,
  isNativeBuyToken,
  isNativeSellToken,
  isNativeToken,
  isNativeTokenAddress,
  tokenContractsEqual,
  useIsActiveAccountAddress,
};
