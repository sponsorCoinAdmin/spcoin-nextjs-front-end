// File: @/lib/1Inch/fetcher.tsx
'use client';

import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';
import {
  useApiErrorMessage,
  useBuyAmount,
  useErrorMessage,
  useSellAmount,
  useTradeData,
  useAppChainId,
} from '@/lib/context/hooks';
import { STATUS, CHAIN_ID } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getOneInchApiBase, getOneInchQuote, type OneInchQuoteParams } from '@/lib/api';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_PRICE_API === 'true' || true;
const debugLog = createDebugLogger('usePriceAPI', DEBUG_ENABLED, LOG_TIME);

const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000' as Address;

const fetcher = async ([params]: [OneInchQuoteParams]) => {
  return getOneInchQuote(params, { timeoutMs: 10000 });
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
    if (Object.keys(changesObj).length) debugLog.log?.(`[why-did-you-update] ${name}`, changesObj);
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

  const rawSellTokenAddress = (tradeData?.sellTokenContract?.address ?? ZERO_ADDRESS) as Address;
  const rawBuyTokenAddress = (tradeData?.buyTokenContract?.address ?? ZERO_ADDRESS) as Address;

  const slippagePercentage =
    Number.isFinite(tradeData?.slippage?.bps) && (tradeData?.slippage?.bps ?? 0) > 0
      ? String((tradeData!.slippage!.bps as number) / 100)
      : '1';

  const apiBaseAvailable = getOneInchApiBase().length > 0;

  const shouldFetch =
    apiBaseAvailable &&
    !!tradeData?.sellTokenContract &&
    !!tradeData?.buyTokenContract &&
    rawSellTokenAddress.toLowerCase() !== rawBuyTokenAddress.toLowerCase() &&
    sellAmount > 0n &&
    !!userAddress &&
    chainId !== CHAIN_ID.HARDHAT_BASE;

  const quoteParams: OneInchQuoteParams | null = shouldFetch
    ? {
        chainId,
        fromTokenAddress: rawSellTokenAddress,
        toTokenAddress: rawBuyTokenAddress,
        amount: sellAmount.toString(),
        fromAddress: userAddress!,
        slippage: slippagePercentage,
      }
    : null;

  const swrKey = quoteParams ? [quoteParams] as [OneInchQuoteParams] : null;

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

  return useSWR<unknown, Error, [OneInchQuoteParams] | null>(swrKey, fetcher, {
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
