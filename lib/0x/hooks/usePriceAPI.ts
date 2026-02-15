// File: @/lib/0x/hooks/usePriceAPI.ts
'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { isAddress, type Address } from 'viem';

import type { PriceRequestParams } from '@/lib/structure';
import { TRADE_DIRECTION, STATUS } from '@/lib/structure';
import { CHAIN_ID } from '@/lib/structure/enums/networkIds';
import {
  useApiErrorMessage,
  useBuyAmount,
  useExchangeContext,
  useSellAmount,
  useTradeData,
  useAppChainId,
} from '@/lib/context/hooks';
import type PriceResponse from '@/lib/0x/typesV1';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getZeroXPrice } from '@/lib/api';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_SERVER_DEBUG_LOG_0X_PRICE_API === 'true';
const debugLog = createDebugLogger('usePriceAPI', DEBUG_ENABLED, LOG_TIME);

type FetchKey = [string, PriceRequestParams];
const API_PRICE_PATH = '/api/0x/price';

const fetcher = async ([, params]: FetchKey) => {
  const { sellAmount, buyAmount } = params;
  if (
    (sellAmount !== undefined && sellAmount === '0') ||
    (buyAmount !== undefined && buyAmount === '0')
  ) {
    debugLog.warn?.('Blocked get with zero amount', { sellAmount, buyAmount });
    return;
  }
  return getZeroXPrice(params, { timeoutMs: 10000 });
};

const getPriceApiCall = (
  tradeDirection: TRADE_DIRECTION,
  chainId: number,
  sellTokenAddress: Address | undefined,
  buyTokenAddress: Address | undefined,
  sellAmount: bigint,
  buyAmount: bigint,
  slippageBps?: number,
): FetchKey | undefined => {
  if (!sellTokenAddress || !buyTokenAddress) return undefined;
  if (
    (tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT && sellAmount === 0n) ||
    (tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN && buyAmount === 0n)
  ) {
    return undefined;
  }

  const params: PriceRequestParams = {
    chainId,
    sellToken: sellTokenAddress,
    buyToken: buyTokenAddress,
    ...(tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT ? { sellAmount: sellAmount.toString() } : {}),
    ...(tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN ? { buyAmount: buyAmount.toString() } : {}),
    ...(typeof slippageBps === 'number' && !Number.isNaN(slippageBps) ? { slippageBps } : {}),
  };
  return [API_PRICE_PATH, params];
};

function usePriceAPI() {
  const { exchangeContext } = useExchangeContext();
  const tradeData = useTradeData();
  const [chainId] = useAppChainId();
  const [, setApiErrorMessage] = useApiErrorMessage();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [sellAmount, setSellAmount] = useSellAmount();

  const sellTokenAddress = tradeData.sellTokenContract?.address as Address | undefined;
  const buyTokenAddress = tradeData.buyTokenContract?.address as Address | undefined;

  const debouncedSellToken = useDebounce(sellTokenAddress, 450);
  const debouncedBuyToken = useDebounce(buyTokenAddress, 450);
  const debouncedSellAmount = useDebounce(sellAmount, 450);
  const debouncedBuyAmount = useDebounce(buyAmount, 450);
  const debouncedSlippage = useDebounce(
    Number.isFinite(tradeData?.slippage?.bps) ? tradeData.slippage.bps : 100,
    200,
  );

  const shouldFetch = (sellToken?: Address, buyToken?: Address, effectiveAmount?: bigint): boolean => {
    if (!chainId) return false;
    if (!isAddress(sellToken ?? '')) return false;
    if (!isAddress(buyToken ?? '')) return false;
    if ((sellToken as string).toLowerCase() === (buyToken as string).toLowerCase()) return false;
    if (!effectiveAmount || effectiveAmount === 0n) return false;
    if (chainId === CHAIN_ID.HARDHAT) return false;
    return true;
  };

  useEffect(() => {
    if (
      tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT &&
      sellAmount === 0n &&
      buyAmount !== 0n
    ) {
      setBuyAmount(0n);
    }
    if (
      tradeData.tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN &&
      buyAmount === 0n &&
      sellAmount !== 0n
    ) {
      setSellAmount(0n);
    }
  }, [tradeData.tradeDirection, sellAmount, buyAmount, setBuyAmount, setSellAmount]);

  const amountForDirection =
    tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT ? debouncedSellAmount : debouncedBuyAmount;

  const swrKey: FetchKey | null = shouldFetch(
    debouncedSellToken,
    debouncedBuyToken,
    amountForDirection,
  )
    ? getPriceApiCall(
        tradeData.tradeDirection,
        chainId,
        debouncedSellToken,
        debouncedBuyToken,
        debouncedSellAmount,
        debouncedBuyAmount,
        debouncedSlippage,
      ) ?? null
    : null;

  const swr = useSWR<unknown, Error, FetchKey | null>(swrKey, fetcher, {
    onSuccess: (data: any) => {
      if (data && typeof data === 'object' && 'code' in data) {
        setApiErrorMessage({
          status: STATUS.ERROR_API_PRICE,
          source: 'ApiFetcher',
          errCode: (data as any).code,
          msg: JSON.stringify(
            {
              ERROR: 'API Call',
              server: process.env.NEXT_PUBLIC_API_SERVER,
              network: exchangeContext.network?.name,
              sellTokenAddress,
              buyTokenAddress,
              tradeDirection: tradeData.tradeDirection,
              sellAmount,
              buyAmount,
              response_data: data as PriceResponse,
            },
            null,
            2,
          ),
        });
        return;
      }

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
    },
    onError: (error: any) => {
      debugLog.error?.('API ERROR', error);
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
