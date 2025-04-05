import { useEffect, useRef } from 'react';
import { PriceRequestParams, TRADE_DIRECTION, HARDHAT, STATUS } from '@/lib/structure/types';
import qs from "qs";
import useSWR from 'swr';
import {
  useApiErrorMessage,
  useBuyAmount,
  useErrorMessage,
  useExchangeContext,
  useSellAmount,
  useTradeData
} from '@/lib/context/contextHooks';
import { useIsActiveAccountAddress, useMapAccountAddrToWethAddr } from '../network/utils';
import { Address } from 'viem';
import PriceResponse from '@/lib/0X/typesV1';
import { useChainId } from "wagmi";
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const API_PROVIDER="0X/"
const NEXT_PUBLIC_API_SERVER = process.env.NEXT_PUBLIC_API_SERVER+API_PROVIDER;
const apiPriceBase = "/price";

const WRAPPED_ETHEREUM_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

const validTokenOrNetworkCoin = (address: Address, isActiveAccount: boolean): Address => {
  return isActiveAccount ? WRAPPED_ETHEREUM_ADDRESS : address;
};

const fetcher = async ([endpoint, params]: [string, PriceRequestParams]) => {
  endpoint = NEXT_PUBLIC_API_SERVER + endpoint;
  const { sellAmount, buyAmount } = params;

  // ✅ Skip fetch if no amounts
  if (!sellAmount && !buyAmount) return;

  // ✅ Strip out undefined, null, or empty string values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );

  const query = qs.stringify(cleanParams);
  const apiCall = `${endpoint}?${query}`;

  console.log(JSON.stringify(apiCall));

  const response = await fetch(apiCall);
  return response.json();
};

const getApiErrorTransactionData = (
  exchangeContext: any,
  sellTokenAddress: Address | undefined,
  buyTokenAddress: Address | undefined,
  sellAmount: any,
  data: PriceResponse
) => ({
  ERROR: `API Call`,
  Server: `${process.env.NEXT_PUBLIC_API_SERVER}`,
  netWork: `${exchangeContext.network.name.toLowerCase()}`,
  apiPriceBase,
  sellTokenAddress,
  buyTokenAddress,
  sellAmount,
  response_data: data,
});

const getPriceApiCall = (
  transactionType: TRADE_DIRECTION,
  chainId: number,
  sellTokenAddress: Address | undefined,
  buyTokenAddress: Address | undefined,
  sellAmount: bigint,
  buyAmount: bigint,
  slippageBps?: number
): [string, PriceRequestParams] | undefined => {
  if (!sellTokenAddress || !buyTokenAddress) return undefined;

  const params: PriceRequestParams = {
    chainId,
    sellToken: sellTokenAddress,
    buyToken: buyTokenAddress,
    ...(transactionType === TRADE_DIRECTION.SELL_EXACT_OUT && sellAmount !== 0n
      ? { sellAmount: sellAmount.toString() }
      : {}),
    ...(transactionType === TRADE_DIRECTION.BUY_EXACT_IN && buyAmount !== 0n
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
      console.log(`[why-did-you-update] ${name}`, changesObj);
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

  const shouldFetch = (sellTokenAddress?: Address, buyTokenAddress?: Address): boolean => (
    sellTokenAddress !== undefined &&
    buyTokenAddress !== undefined &&
    sellTokenAddress !== buyTokenAddress &&
    chainId !== HARDHAT
  );

  const swrKey = shouldFetch(sellTokenAddress, buyTokenAddress)
    ? getPriceApiCall(
      tradeData.transactionType,
      chainId,
      sellTokenAddress,
      buyTokenAddress,
      sellAmount,
      buyAmount,
      Number.isFinite(tradeData.slippageBps) ? tradeData.slippageBps : 100)
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

  return useSWR(swrKey, fetcher, {
    onSuccess: (data) => {
      console.log(`[API SUCCESS] Direction: ${tradeData.transactionType}, Response:`, data);

      if (data.code) {
        setApiErrorMessage({
          status: STATUS.ERROR_API_PRICE,
          source: "ApiFetcher",
          errCode: data.code,
          msg: getApiErrorTransactionData(
            exchangeContext,
            sellTokenAddress,
            buyTokenAddress,
            tradeData.transactionType === TRADE_DIRECTION.SELL_EXACT_OUT ? sellAmount : buyAmount,
            data
          ),
        });
      } else {
        if (tradeData.transactionType === TRADE_DIRECTION.SELL_EXACT_OUT && data?.buyAmount !== undefined) {
          setBuyAmount(BigInt(data.buyAmount ?? 0));
        } else if (tradeData.transactionType === TRADE_DIRECTION.BUY_EXACT_IN && data?.sellAmount !== undefined) {
          setSellAmount(BigInt(data.sellAmount ?? 0));
        }
      }
    },
    onError: (error) =>
      setApiErrorMessage({
        status: STATUS.ERROR_API_PRICE,
        source: "ApiFetcher",
        errCode: error.code,
        msg: error,
      }),
  });
}

export { usePriceAPI };