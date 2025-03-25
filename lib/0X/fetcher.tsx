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
import { stringifyBigInt } from '../spCoin/utils';

const NEXT_PUBLIC_API_SERVER = process.env.NEXT_PUBLIC_API_SERVER;
const apiPriceBase = "/price";

const WRAPPED_ETHEREUM_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

const validTokenOrNetworkCoin = (address: Address, isActiveAccount: boolean): Address => {
  return isActiveAccount ? WRAPPED_ETHEREUM_ADDRESS : address;
};

const fetcher = async ([endpoint, params]: [string, PriceRequestParams]) => {
  endpoint = NEXT_PUBLIC_API_SERVER + endpoint;
  const { sellAmount, buyAmount } = params;

  if (!sellAmount && !buyAmount) return;

  const query = qs.stringify(params);
  const apiCall = `${endpoint}?${query}`;

  // ✅ Added console.log to show the actual API call
  console.log("Executing API Call:", apiCall);

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
) => {
  return (sellAmount === 0n && transactionType === TRADE_DIRECTION.SELL_EXACT_OUT) ||
    (buyAmount === 0n && transactionType === TRADE_DIRECTION.BUY_EXACT_IN)
    ? undefined
    : [
      apiPriceBase,
      {
        chainId,
        sellToken: sellTokenAddress,
        buyToken: buyTokenAddress,
        sellAmount: transactionType === TRADE_DIRECTION.SELL_EXACT_OUT ? sellAmount.toString() : undefined,
        buyAmount: transactionType === TRADE_DIRECTION.BUY_EXACT_IN ? buyAmount.toString() : undefined,
        slippageBps
      },
    ];
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
      tradeData.slippageBps)
    : null;
    // console.log(`exchangeContext: ${stringifyBigInt(exchangeContext)}`)
    // console.log(`tradeData:       ${stringifyBigInt(tradeData)}`)
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

  console.log(`useSWR:Fetcher tradeData before API Call: ${stringifyBigInt(tradeData)}`)

  return useSWR(swrKey, fetcher, {
    onSuccess: (data) =>
      data.code
        ? setApiErrorMessage({
            status: STATUS.ERROR_API_PRICE,
            source: "ApiFetcher",
            errCode: data.code,
            msg: getApiErrorTransactionData(
              exchangeContext,
              sellTokenAddress,
              buyTokenAddress,
              sellAmount,
              data),
          })
        : setBuyAmount(data.buyAmount || 0n),
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
