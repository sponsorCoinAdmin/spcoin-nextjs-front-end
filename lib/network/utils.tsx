// File: lib/network/utils.tsx

import { useExchangeContext } from '@/lib/context/hooks';
import type { Address } from 'viem';
import type {
  ExchangeContext,
  TokenContract,
  TradeData,
} from '@/lib/structure';
import {
  NATIVE_TOKEN_ADDRESS,
  BURN_ADDRESS,
} from '../structure/constants/addresses';

// Centralized asset/logo helpers are implemented in assetUtils/assetHelpers.
// Re-export them here so existing imports from `lib/network/utils` keep working
// without duplicating logo path logic.
export {
  getLogoURL,
  getTokenLogoURL,
  getAssetLogoURL,
  getAccountLogo,
} from '@/lib/context/helpers/assetHelpers';

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
