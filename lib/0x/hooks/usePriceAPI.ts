// File: lib/hooks/usePriceAPI.ts
'use client';

import { useEffect, useRef } from 'react';
import { stringify } from 'qs';
import useSWR from 'swr';
import { isAddress, type Address } from 'viem';

import type { PriceRequestParams } from '@/lib/structure';
import { TRADE_DIRECTION, STATUS } from '@/lib/structure';
import { CHAIN_ID } from '@/lib/structure/enums/networkIds';

import {
  useApiErrorMessage,
  useBuyAmount,
  useErrorMessage,
  useExchangeContext,
  useSellAmount,
  useTradeData,
  useAppChainId, // returns [number, setter]
} from '@/lib/context/hooks';

import type PriceResponse from '@/lib/0x/typesV1';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getJson } from '@/lib/rest/http';

console.log('[usePriceAPI] loaded — Option A env wiring (2025-11-22-D)');

// ────────────────────────────────────────────────────────────────
// API base config
//
//   We treat NEXT_PUBLIC_API_SERVER as an *origin only*:
//
//     .env.local (dev):        NEXT_PUBLIC_API_SERVER=
//     .env.production (prod):  NEXT_PUBLIC_API_SERVER=https://www.sponsorcoin.org
//
//   The full route path is baked in here:
//
//     /api/0x/price
//
//   So the final URL is either:
//     - '/api/0x/price?...'                         (relative, same origin)
//     - 'https://www.sponsorcoin.org/api/0x/price' (if origin is set)
// ────────────────────────────────────────────────────────────────
const RAW_API_SERVER = String(process.env.NEXT_PUBLIC_API_SERVER ?? '').trim();

// Strip trailing slashes; we will add the path ourselves.
const NEXT_PUBLIC_API_SERVER =
  RAW_API_SERVER.length === 0 ? '' : RAW_API_SERVER.replace(/\/+$/, '');

// Full route path (including /api and /0x)
const apiPriceBase = '/api/0x/price';

console.log('[usePriceAPI] ENV wiring', {
  RAW_API_SERVER,
  NEXT_PUBLIC_API_SERVER,
  apiPriceBase,
});

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_0X_PRICE_API === 'true';
const debugLog = createDebugLogger('usePriceAPI', DEBUG_ENABLED, LOG_TIME);

const validTokenOrNetworkCoin = (address: Address): Address => address;

type FetchKey = [string, PriceRequestParams];

const fetcher = async ([endpoint, params]: FetchKey) => {
  const base = NEXT_PUBLIC_API_SERVER; // '' or 'https://www.sponsorcoin.org'
  endpoint = base + endpoint; // e.g. '' + '/api/0x/price' or 'https://www.sponsorcoin.org' + '/api/0x/price'

  const { sellAmount, buyAmount } = params;

  // Hard console log: this should show up in browser devtools
  console.log('[usePriceAPI] fetcher called', {
    endpoint,
    params,
  });

  if (
    (sellAmount !== undefined && sellAmount === '0') ||
    (buyAmount !== undefined && buyAmount === '0')
  ) {
    debugLog.warn?.('Blocked get with zero amount', { sellAmount, buyAmount });
    return;
  }

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );

  const query = stringify(cleanParams);
  const apiCall = `${endpoint}?${query}`;
  debugLog.log?.('📡 Fetching:', apiCall);
  console.log('[usePriceAPI] 📡 Fetching URL:', apiCall);

  // 🔁 RESTful call (timeout + retries + JSON validation)
  const data = await getJson<unknown>(apiCall, {
    timeoutMs: 10_000,
    retries: 1,
    accept: 'application/json',
  });

  return data;
};

const getApiErrorTransactionData = (
  exchangeContext: any,
  sellTokenAddress: Address | undefined,
  buyTokenAddress: Address | undefined,
  sellAmount: any,
  data: PriceResponse
) => ({
  ERROR: 'API Call',
  Server: `${process.env.NEXT_PUBLIC_API_SERVER}`,
  netWork: `${exchangeContext.network.name.toLowerCase()}`,
  apiPriceBase,
  sellTokenAddress,
  buyTokenAddress,
  sellAmount,
  response_data: data,
});

const getPriceApiCall = (
  tradeDirection: TRADE_DIRECTION,
  chainId: number,
  sellTokenAddress: Address | undefined,
  buyTokenAddress: Address | undefined,
  sellAmount: bigint,
  buyAmount: bigint,
  slippageBps?: number
): FetchKey | undefined => {
  if (!sellTokenAddress || !buyTokenAddress) return undefined;

  if (
    (tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT && sellAmount === 0n) ||
    (tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN && buyAmount === 0n)
  ) {
    debugLog.warn?.('Skipping get due to 0 amount', { tradeDirection, sellAmount, buyAmount });
    return undefined;
  }

  const params: PriceRequestParams = {
    chainId,
    sellToken: sellTokenAddress,
    buyToken: buyTokenAddress,
    ...(tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
      ? { sellAmount: sellAmount.toString() }
      : {}),
    ...(tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN
      ? { buyAmount: buyAmount.toString() }
      : {}),
    ...(typeof slippageBps === 'number' && !Number.isNaN(slippageBps)
      ? { slippageBps }
      : {}),
  };

  // Note: we now return the full path here (`/api/0x/price`)
  return [apiPriceBase, params];
};

function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef(props);

  useEffect(() => {
    const allKeys = Object.keys({ ...previousProps.current, ...props });
    const changesObj: Record<string, { from: any; to: any }> = {};

    allKeys.forEach((key) => {
      if (previousProps.current[key] !== props[key]) {
        changesObj[key] = { from: previousProps.current[key], to: props[key] };
      }
    });

    if (Object.keys(changesObj).length) {
      debugLog.log?.(`[why-did-you-update] ${name}`, changesObj);
    }

    previousProps.current = props;
  });
}

function usePriceAPI() {
  const { exchangeContext } = useExchangeContext();
  const tradeData = useTradeData();
  const [chainId] = useAppChainId();

  const [errorMessage] = useErrorMessage();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [sellAmount, setSellAmount] = useSellAmount();

  let sellTokenAddress = tradeData.sellTokenContract?.address as Address | undefined;
  let buyTokenAddress = tradeData.buyTokenContract?.address as Address | undefined;

  sellTokenAddress = sellTokenAddress ? validTokenOrNetworkCoin(sellTokenAddress) : undefined;
  buyTokenAddress = buyTokenAddress ? validTokenOrNetworkCoin(buyTokenAddress) : undefined;

  const debouncedSellToken = useDebounce(sellTokenAddress, 450);
  const debouncedBuyToken = useDebounce(buyTokenAddress, 450);
  const debouncedSellAmount = useDebounce(sellAmount, 450);
  const debouncedBuyAmount = useDebounce(buyAmount, 450);
  const debouncedSlippage = useDebounce(
    Number.isFinite(tradeData?.slippage?.bps) ? tradeData.slippage.bps : 100,
    200
  );

  const shouldFetch = (
    sellToken?: Address,
    buyToken?: Address,
    effectiveAmount?: bigint
  ): boolean => {
    if (!chainId) {
      debugLog.warn?.('Missing chainId');
      return false;
    }
    if (!isAddress(sellToken ?? '')) {
      debugLog.warn?.('Invalid or missing sellTokenAddress', sellToken);
      return false;
    }
    if (!isAddress(buyToken ?? '')) {
      debugLog.warn?.('Invalid or missing buyTokenAddress', buyToken);
      return false;
    }
    if ((sellToken as string).toLowerCase() === (buyToken as string).toLowerCase()) {
      debugLog.warn?.('Sell and buy tokens are the same');
      return false;
    }
    if (!effectiveAmount || effectiveAmount === 0n) {
      debugLog.warn?.('Amount is 0');
      return false;
    }
    if (chainId === CHAIN_ID.HARDHAT) {
      debugLog.warn?.('Chain is HARDHAT');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT && sellAmount === 0n) {
      if (buyAmount !== 0n) setBuyAmount(0n);
    }
    if (tradeData.tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN && buyAmount === 0n) {
      if (sellAmount !== 0n) setSellAmount(0n);
    }
  }, [tradeData.tradeDirection, sellAmount, buyAmount, setBuyAmount, setSellAmount]);

  const amountForDirection =
    tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
      ? debouncedSellAmount
      : debouncedBuyAmount;

  const swrKey: FetchKey | null = shouldFetch(
    debouncedSellToken,
    debouncedBuyToken,
    amountForDirection
  )
    ? getPriceApiCall(
        tradeData.tradeDirection,
        chainId,
        debouncedSellToken,
        debouncedBuyToken,
        debouncedSellAmount,
        debouncedBuyAmount,
        debouncedSlippage
      ) ?? null
    : null;

  // 🔍 Hard snapshot so we can see *why* it may or may not fetch
  useEffect(() => {
    console.log('[usePriceAPI] snapshot', {
      NEXT_PUBLIC_API_SERVER,
      chainId,
      tradeDirection: tradeData.tradeDirection,
      sellTokenAddress,
      buyTokenAddress,
      debouncedSellToken,
      debouncedBuyToken,
      sellAmount: sellAmount.toString(),
      buyAmount: buyAmount.toString(),
      debouncedSellAmount: debouncedSellAmount.toString(),
      debouncedBuyAmount: debouncedBuyAmount.toString(),
      debouncedSlippage,
      amountForDirection: amountForDirection?.toString(),
      shouldFetch: !!swrKey,
      swrKey,
      errorMessage,
      apiErrorMessage,
    });
  }, [
    chainId,
    tradeData.tradeDirection,
    sellTokenAddress,
    buyTokenAddress,
    debouncedSellToken,
    debouncedBuyToken,
    sellAmount,
    buyAmount,
    debouncedSellAmount,
    debouncedBuyAmount,
    debouncedSlippage,
    amountForDirection,
    swrKey,
    errorMessage,
    apiErrorMessage,
  ]);

  useWhyDidYouUpdate('usePriceAPI', {
    exchangeContext,
    tradeData,
    chainId,
    sellTokenAddress,
    buyTokenAddress,
    buyAmount,
    sellAmount,
    errorMessage,
    apiErrorMessage,
    swrKey,
  });

  const swr = useSWR<unknown, Error, FetchKey | null>(swrKey, fetcher, {
    onSuccess: (data: any) => {
      debugLog.log?.('✅ API SUCCESS', data);
      console.log('[usePriceAPI] ✅ API SUCCESS', data);

      if (data && typeof data === 'object' && 'code' in data) {
        setApiErrorMessage({
          status: STATUS.ERROR_API_PRICE,
          source: 'ApiFetcher',
          errCode: (data as any).code,
          msg: JSON.stringify(
            getApiErrorTransactionData(
              exchangeContext,
              sellTokenAddress,
              buyTokenAddress,
              tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT ? sellAmount : buyAmount,
              data as PriceResponse
            ),
            null,
            2
          ),
        });
      } else {
        if (
          tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT &&
          (data as any)?.buyAmount !== undefined
        ) {
          const next = BigInt((data as any).buyAmount ?? 0);
          if (buyAmount !== next) setBuyAmount(next);
        } else if (
          tradeData.tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN &&
          (data as any)?.sellAmount !== undefined
        ) {
          const next = BigInt((data as any).sellAmount ?? 0);
          if (sellAmount !== next) setSellAmount(next);
        }
      }
    },
    onError: (error: any) => {
      debugLog.error?.('❌ API ERROR', error);
      console.error('[usePriceAPI] ❌ API ERROR', error);
      setApiErrorMessage({
        status: STATUS.ERROR_API_PRICE,
        source: 'ApiFetcher',
        errCode: error?.code ?? 'UNKNOWN_ERROR',
        msg: error?.message ?? String(error),
      });
    },
  });

  return { ...swr, swrKey };
}

export { usePriceAPI, getPriceApiCall };
