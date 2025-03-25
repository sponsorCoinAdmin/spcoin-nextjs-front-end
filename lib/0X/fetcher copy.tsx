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
  const query = qs.stringify(params);
  const apiCall = `${endpoint}?${query}`;

  console.log("Executing API Call:", apiCall);

  const response = await fetch(apiCall);
  return response.json();
};

const getApiErrorTransactionData = (
  exchangeContext: any,
  sellTokenAddress: Address | undefined,
  buyTokenAddress: Address | undefined,
  amount: bigint,
  data: PriceResponse
) => ({
  ERROR: `API Call`,
  Server: `${process.env.NEXT_PUBLIC_API_SERVER}`,
  netWork: `${exchangeContext.network.name.toLowerCase()}`,
  apiPriceBase,
  sellTokenAddress,
  buyTokenAddress,
  amount,
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
  if (!sellTokenAddress || !buyTokenAddress || sellTokenAddress === buyTokenAddress || chainId === HARDHAT) {
    return null;
  }

  return [
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

function usePriceAPI() {
  const { exchangeContext } = useExchangeContext();
  const tradeData = useTradeData();
  const chainId = useChainId();
  const [errorMessage] = useErrorMessage();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [sellAmount, setSellAmount] = useSellAmount();

  const sellTokenAddress = useMapAccountAddrToWethAddr(validTokenOrNetworkCoin(tradeData.sellTokenContract?.address as Address, useIsActiveAccountAddress(tradeData.sellTokenContract?.address as Address)));
  const buyTokenAddress = useMapAccountAddrToWethAddr(validTokenOrNetworkCoin(tradeData.buyTokenContract?.address as Address, useIsActiveAccountAddress(tradeData.buyTokenContract?.address as Address)));

  const swrKey = getPriceApiCall(
    tradeData.transactionType,
    chainId,
    sellTokenAddress,
    buyTokenAddress,
    sellAmount,
    buyAmount,
    tradeData.slippageBps
  );

  return useSWR(swrKey, fetcher, {
    onSuccess: (data) => {
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
        if (tradeData.transactionType === TRADE_DIRECTION.SELL_EXACT_OUT) {
          setBuyAmount(BigInt(data.buyAmount));
        } else if (tradeData.transactionType === TRADE_DIRECTION.BUY_EXACT_IN) {
          setSellAmount(BigInt(data.sellAmount));
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
