import { useEffect, useRef } from 'react';
import { PriceRequestParams, TRADE_DIRECTION, HARDHAT, STATUS } from '@/lib/structure/types';
import { stringify } from 'qs';
import useSWR from 'swr';
import { isAddress } from 'viem';
import {
  useApiErrorMessage,
  useBuyAmount,
  useErrorMessage,
  useExchangeContext,
  useSellAmount,
  useTradeData
} from '@/lib/context/contextHooks';
import { useIsActiveAccountAddress, useMapAccountAddrToWethAddr } from '../../network/utils';
import { Address } from 'viem';
import PriceResponse from '@/lib/0X/typesV1';
import { useChainId } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const API_PROVIDER = '0X/';
const NEXT_PUBLIC_API_SERVER = process.env.NEXT_PUBLIC_API_SERVER + API_PROVIDER;
const apiPriceBase = '/price';
const WRAPPED_ETHEREUM_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

// 🌐 Debug logging flag and logger controlled by .env.local
const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.DEBUG_LOG_API_0X_PRICE_REQUEST=== 'true';
const debugLog = createDebugLogger('usePriceAPI', DEBUG_ENABLED, LOG_TIME); // tsFlag defaults to true

const validTokenOrNetworkCoin = (address: Address, isActiveAccount: boolean): Address => {
  return isActiveAccount ? WRAPPED_ETHEREUM_ADDRESS : address;
};

const fetcher = async ([endpoint, params]: [string, PriceRequestParams]) => {
  endpoint = NEXT_PUBLIC_API_SERVER + endpoint;
  const { sellAmount, buyAmount } = params;

  if (
    (sellAmount !== undefined && sellAmount === '0') ||
    (buyAmount !== undefined && buyAmount === '0')
  ) {
    debugLog.warn(`Blocked fetch with zero amount`, { sellAmount, buyAmount });
    return;
  }

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );

  const query = stringify(cleanParams);
  const apiCall = `${endpoint}?${query}`;

  debugLog.log(`📡 Fetching:`, apiCall);

  const response = await fetch(apiCall);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
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
): [string, PriceRequestParams] | undefined => {
  if (!sellTokenAddress || !buyTokenAddress) return undefined;

  if (
    (tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT && sellAmount === 0n) ||
    (tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN && buyAmount === 0n)
  ) {
    debugLog.warn(`Skipping fetch due to 0 amount`, { tradeDirection, sellAmount, buyAmount });
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

  return [apiPriceBase, params];
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
      debugLog.log(`[why-did-you-update] ${name}`, changesObj);
    }

    previousProps.current = props;
  });
}

function usePriceAPI() {
  const { exchangeContext } = useExchangeContext();
  const tradeData = useTradeData();
  const chainId = useChainId();
  const [errorMessage] = useErrorMessage();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [sellAmount, setSellAmount] = useSellAmount();

  let sellTokenAddress = tradeData.sellTokenContract?.address;
  let buyTokenAddress = tradeData.buyTokenContract?.address;

  const isActiveSellAccount = useIsActiveAccountAddress(sellTokenAddress as Address);
  const isActiveBuyAccount = useIsActiveAccountAddress(buyTokenAddress as Address);

  sellTokenAddress = useMapAccountAddrToWethAddr(validTokenOrNetworkCoin(sellTokenAddress as Address, isActiveSellAccount));
  buyTokenAddress = useMapAccountAddrToWethAddr(validTokenOrNetworkCoin(buyTokenAddress as Address, isActiveBuyAccount));

  const debouncedSellToken = useDebounce(sellTokenAddress, 450);
  const debouncedBuyToken = useDebounce(buyTokenAddress, 450);
  const debouncedSellAmount = useDebounce(sellAmount, 450);
  const debouncedBuyAmount = useDebounce(buyAmount, 450);
  const debouncedSlippage = useDebounce(
    Number.isFinite(tradeData.slippageBps) ? tradeData.slippageBps : 100,
    200
  );

  const shouldFetch = (
    sellTokenAddress?: Address,
    buyTokenAddress?: Address,
    amount?: bigint
  ): boolean => {
    if (!isAddress(sellTokenAddress ?? '')) {
      debugLog.warn(`Invalid or missing sellTokenAddress`, sellTokenAddress);
      return false;
    }

    if (!isAddress(buyTokenAddress ?? '')) {
      debugLog.warn(`Invalid or missing buyTokenAddress`, buyTokenAddress);
      return false;
    }

    if (sellTokenAddress!.toLowerCase() === buyTokenAddress!.toLowerCase()) {
      debugLog.warn(`Sell and buy tokens are the same`);
      return false;
    }

    if (!amount || amount === 0n) {
      debugLog.warn(`Amount is 0`);
      return false;
    }

    if (chainId === HARDHAT) {
      debugLog.warn(`Chain is HARDHAT`);
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT && sellAmount === 0n) {
      setBuyAmount(0n);
    }
    if (tradeData.tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN && buyAmount === 0n) {
      setSellAmount(0n);
    }
  }, [tradeData.tradeDirection, sellAmount, buyAmount]);

  const swrKey = shouldFetch(debouncedSellToken, debouncedBuyToken, debouncedSellAmount)
    ? getPriceApiCall(
        tradeData.tradeDirection,
        chainId,
        debouncedSellToken,
        debouncedBuyToken,
        debouncedSellAmount,
        debouncedBuyAmount,
        debouncedSlippage
      )
    : null;

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
    swrKey
  });

  const swr = useSWR(swrKey, fetcher, {
    onSuccess: (data) => {
      debugLog.log(`✅ API SUCCESS`, data);

      if (data && typeof data === 'object' && 'code' in data) {
        setApiErrorMessage({
          status: STATUS.ERROR_API_PRICE,
          source: 'ApiFetcher',
          errCode: (data as any).code,
          msg: getApiErrorTransactionData(
            exchangeContext,
            sellTokenAddress,
            buyTokenAddress,
            tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT ? sellAmount : buyAmount,
            data
          ),
        });
      } else {
        if (tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT && data?.buyAmount !== undefined) {
          setBuyAmount(BigInt(data.buyAmount ?? 0));
        } else if (tradeData.tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN && data?.sellAmount !== undefined) {
          setSellAmount(BigInt(data.sellAmount ?? 0));
        }
      }
    },
    onError: (error: any) => {
      debugLog.error(`❌ API ERROR`, error);

      setApiErrorMessage({
        status: STATUS.ERROR_API_PRICE,
        source: 'ApiFetcher',
        errCode: error?.code ?? 'UNKNOWN_ERROR',
        msg: error?.message ?? String(error),
      });
    },
  });

  return {
    ...swr,
    swrKey
  };
}

export { usePriceAPI };
