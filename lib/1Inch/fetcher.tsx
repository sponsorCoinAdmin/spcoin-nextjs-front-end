// File: lib/hooks/usePriceAPI.ts
'use client';

import { useEffect, useRef } from 'react';
import { STATUS, CHAIN_ID } from '@/lib/structure';
import useSWR from 'swr';
import {
  useApiErrorMessage,
  useBuyAmount,
  useErrorMessage,
  useSellAmount,
  useTradeData,
  useAppChainId,
} from '@/lib/context/hooks';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getJson } from '@/lib/rest/http';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_PRICE_API === 'true';
const debugLog = createDebugLogger('usePriceAPI', DEBUG_ENABLED, LOG_TIME);

// 🔧 API base config
// You said this points at your site (e.g. https://www.sponsorcoin.com/api/)
const RAW_API_SERVER = String(process.env.NEXT_PUBLIC_API_SERVER ?? '').trim();

// Normalize so we always have exactly one trailing slash
const NORMALIZED_API_SERVER =
  RAW_API_SERVER.length === 0
    ? ''
    : RAW_API_SERVER.endsWith('/')
    ? RAW_API_SERVER
    : `${RAW_API_SERVER}/`;

// This is the 1Inch provider segment on your API
const API_PROVIDER = '1Inch/';

// Final base: e.g. "https://www.sponsorcoin.com/api/1Inch/"
const NEXT_PUBLIC_API_SERVER = NORMALIZED_API_SERVER + API_PROVIDER;

// Keep the path the same as before (you had '/quote')
const apiPriceBase = 'quote';

if (DEBUG_ENABLED) {
  debugLog.log?.('[CONFIG] RAW_API_SERVER:', RAW_API_SERVER || '(empty)');
  debugLog.log?.('[CONFIG] NORMALIZED_API_SERVER:', NORMALIZED_API_SERVER || '(empty)');
  debugLog.log?.('[CONFIG] NEXT_PUBLIC_API_SERVER:', NEXT_PUBLIC_API_SERVER || '(empty)');
}

const ZERO_ADDRESS: Address =
  '0x0000000000000000000000000000000000000000' as Address;

// ✅ RESTful fetcher using shared helper (timeout, retries, JSON validation)
const fetcher = async ([url]: [string]) => {
  debugLog.log?.('[1inch Fetch] URL:', url);
  try {
    const data = await getJson<unknown>(url, {
      timeoutMs: 10_000,
      retries: 1,
      accept: 'application/json',
    });
    return data;
  } catch (err: any) {
    debugLog.error?.('[1inch Fetch ERROR]', {
      message: err?.message ?? String(err),
      name: err?.name,
    });
    throw err;
  }
};

function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef(props);

  useEffect(() => {
    const allKeys = Object.keys({ ...previousProps.current, ...props });
    const changesObj: Record<string, { from: any; to: any }> = {};

    allKeys.forEach((key) => {
      if (previousProps.current[key] !== props[key]) {
        changesObj[key] = {
          from: previousProps.current[key],
          to: props[key],
        };
      }
    });

    if (Object.keys(changesObj).length) {
      debugLog.log?.(`[why-did-you-update] ${name}`, changesObj);
    }

    previousProps.current = props;
  });
}

function usePriceAPI() {
  const tradeData = useTradeData();
  const [chainId] = useAppChainId();
  const { address: userAddress } = useAccount();
  const [errorMessage] = useErrorMessage();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [sellAmount] = useSellAmount();

  const rawSellTokenAddress = (tradeData?.sellTokenContract?.address ??
    ZERO_ADDRESS) as Address;
  const rawBuyTokenAddress = (tradeData?.buyTokenContract?.address ??
    ZERO_ADDRESS) as Address;

  const mappedSellTokenAddress = rawSellTokenAddress;
  const mappedBuyTokenAddress = rawBuyTokenAddress;

  const slippagePercentage =
    Number.isFinite(tradeData?.slippage?.bps) && (tradeData?.slippage?.bps ?? 0) > 0
      ? String((tradeData!.slippage!.bps as number) / 100)
      : '1';

  const apiBaseAvailable = NEXT_PUBLIC_API_SERVER.length > 0;

  const shouldFetch =
    apiBaseAvailable &&
    !!tradeData?.sellTokenContract &&
    !!tradeData?.buyTokenContract &&
    mappedSellTokenAddress.toLowerCase() !== mappedBuyTokenAddress.toLowerCase() &&
    sellAmount > 0n &&
    !!userAddress &&
    chainId !== CHAIN_ID.HARDHAT;

  const url = shouldFetch
    ? `${NEXT_PUBLIC_API_SERVER}${apiPriceBase}?chainId=${chainId}` +
      `&fromTokenAddress=${mappedSellTokenAddress}` +
      `&toTokenAddress=${mappedBuyTokenAddress}` +
      `&amount=${sellAmount.toString()}` +
      `&fromAddress=${userAddress}` +
      `&slippage=${slippagePercentage}`
    : '';

  const swrKey = shouldFetch ? [url] : null;

  // 🔍 Extra debug snapshot so we can see *why* it may or may not fetch in prod
  useEffect(() => {
    if (!DEBUG_ENABLED) return;

    debugLog.log?.('[usePriceAPI] snapshot', {
      apiBaseAvailable,
      NEXT_PUBLIC_API_SERVER: NEXT_PUBLIC_API_SERVER || '(empty)',
      chainId,
      hasSellToken: !!tradeData?.sellTokenContract,
      hasBuyToken: !!tradeData?.buyTokenContract,
      mappedSellTokenAddress,
      mappedBuyTokenAddress,
      sellAmount: sellAmount.toString(),
      buyAmount: buyAmount.toString(),
      hasUserAddress: !!userAddress,
      isHardhat: chainId === CHAIN_ID.HARDHAT,
      shouldFetch,
      swrKey,
      errorMessage,
      apiErrorMessage,
    });

    if (!apiBaseAvailable) {
      debugLog.warn?.(
        '[usePriceAPI] NEXT_PUBLIC_API_SERVER is empty; skipping price fetch. Check .env.production',
      );
    }
  }, [
    apiBaseAvailable,
    chainId,
    tradeData,
    mappedSellTokenAddress,
    mappedBuyTokenAddress,
    sellAmount,
    buyAmount,
    userAddress,
    shouldFetch,
    swrKey,
    errorMessage,
    apiErrorMessage,
  ]);

  useWhyDidYouUpdate('usePriceAPI_1inch', {
    tradeData,
    chainId,
    rawSellTokenAddress,
    rawBuyTokenAddress,
    sellAmount,
    buyAmount,
    errorMessage,
    apiErrorMessage,
    swrKey,
  });

  return useSWR<unknown, Error, [string] | null>(swrKey as [string] | null, fetcher, {
    onSuccess: (data: any) => {
      debugLog.log?.('[1inch SUCCESS]', data);
      if (data?.toTokenAmount) {
        try {
          setBuyAmount(BigInt(data.toTokenAmount));
        } catch {
          // ignore parse errors
        }
      }
    },
    onError: (error: any) => {
      debugLog.error?.('[1inch SWR onError]', {
        message: error?.message ?? String(error),
        code: error?.code,
        name: error?.name,
      });
      setApiErrorMessage({
        status: STATUS.ERROR_API_PRICE,
        source: '1inchFetcher',
        errCode: error?.code ?? 500,
        msg: error?.message ?? String(error),
      });
    },
  });
}

export { usePriceAPI };
