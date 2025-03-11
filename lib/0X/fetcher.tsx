// 'use server'
import { PriceRequestParams, TRANSACTION_TYPE, ErrorMessage, HARDHAT, STATUS } from '@/lib/structure/types';
import qs from "qs";
import useSWR from 'swr';
import { useExchangeContext } from '@/lib/context/ExchangeContext';
import { useIsActiveAccountAddress, isWrappingTransaction, useMapAccountAddrToWethAddr } from '../network/utils';
import { Address } from 'viem';
import PriceResponse from '@/lib/0X/typesV1';
import { useChainId } from "wagmi";

// Constants
const SELL_AMOUNT_ZERO = 100;
const BUY_AMOUNT_ZERO = 200;
const ERROR_0X_RESPONSE = 300;
const WRAPPED_ETHEREUM_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

// Configurations
const NEXT_PUBLIC_API_SERVER = process.env.NEXT_PUBLIC_API_SERVER;
const apiPriceBase = "/price";
const apiQuoteBase = "/quote";

const validTokenOrNetworkCoin = (address: any): any => {
  return useIsActiveAccountAddress(address) ? WRAPPED_ETHEREUM_ADDRESS : address;
};

const fetcher = ([endpoint, params]: [string, PriceRequestParams]) => {
  endpoint = NEXT_PUBLIC_API_SERVER + endpoint;
  let { sellAmount, buyAmount } = params;

  if (!sellAmount && !buyAmount) return;

  if (!sellAmount && buyAmount === "0") {
    throw { errCode: BUY_AMOUNT_ZERO, errMsg: 'Fetcher not executing remote price call: Buy Amount is 0' };
  }

  if (!buyAmount && (sellAmount === undefined || sellAmount === "0")) {
    throw { errCode: SELL_AMOUNT_ZERO, errMsg: 'Fetcher not executing remote price call: Sell Amount is 0' };
  }

  try {
    const query = qs.stringify(params);
    const apiCall = `${endpoint}?${query}`;
    let result = fetch(`${apiCall}`).then((res) => res.json());
    console.debug(`fetcher: apiCall ${apiCall}`);
    return result;
  } catch (e) {
    alert("fetcher Error: " + JSON.stringify(e, null, 2));
    throw { errCode: ERROR_0X_RESPONSE, errMsg: JSON.stringify(e, null, 2) };
  }
};

const getApiErrorTransactionData = (
  sellTokenAddress: Address | undefined,
  buyTokenAddress: Address | undefined,
  sellAmount: any,
  data: PriceResponse
) => {
  // const { exchangeContext } = useExchangeContext();
  return {
    ERROR: `API Call`,
    Server: `${process.env.NEXT_PUBLIC_API_SERVER}`,
    // netWork: `${exchangeContext.network.name.toLowerCase()}`,
    netWork: `${"ToDo add Network"}`,
    apiPriceBase: `${apiPriceBase}`,
    sellTokenAddress: `${sellTokenAddress}`,
    buyTokenAddress: `${buyTokenAddress}`,
    sellAmount: `${sellAmount}`,
    response_data: `${data}`
  };
};

const getPriceApiCall = (
  transactionType: TRANSACTION_TYPE,
  chainId: number,
  sellTokenAddress: Address | undefined,
  buyTokenAddress: Address | undefined,
  sellAmount: bigint,
  buyAmount: bigint,
  slippageBps?: number
) => {
  return (sellAmount === 0n && transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) ||
    (buyAmount === 0n && transactionType === TRANSACTION_TYPE.BUY_EXACT_IN)
    ? undefined
    : [
        apiPriceBase,
        {
          chainId: chainId,
          sellToken: validTokenOrNetworkCoin(sellTokenAddress),
          buyToken: validTokenOrNetworkCoin(buyTokenAddress),
          sellAmount: transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ? sellAmount.toString() : undefined,
          buyAmount: transactionType === TRANSACTION_TYPE.BUY_EXACT_IN ? buyAmount.toString() : undefined,
          slippageBps: slippageBps
        },
      ];
};

type Props = {
  sellTokenAddress?: Address;
  buyTokenAddress?: Address;
  transactionType: TRANSACTION_TYPE;
  sellAmount: bigint;
  buyAmount: bigint;
  slippageBps: number;
  setSellAmount: (amount: bigint) => void;
  setBuyAmount: (amount: bigint) => void;
  setErrorMessage: (message?: ErrorMessage) => void;
  apiErrorCallBack: (error: ErrorMessage) => void;
};

function usePriceAPI({
  sellTokenAddress,
  buyTokenAddress,
  transactionType,
  sellAmount,
  buyAmount,
  slippageBps,
  setSellAmount,
  setBuyAmount,
  setErrorMessage,
  apiErrorCallBack
}: Props) {
  const { exchangeContext } = useExchangeContext();
  sellTokenAddress = useMapAccountAddrToWethAddr(sellTokenAddress as Address);
  buyTokenAddress = useMapAccountAddrToWethAddr(buyTokenAddress as Address);
  const chainId = useChainId();

  const shouldFetch = (sellTokenAddress?: Address, buyTokenAddress?: Address): boolean => {
    return (
      sellTokenAddress !== undefined &&
      buyTokenAddress !== undefined &&
      sellTokenAddress !== buyTokenAddress &&
      chainId !== HARDHAT
    );
  };

  return useSWR(
    () =>
      shouldFetch(sellTokenAddress, buyTokenAddress)
        ? getPriceApiCall(transactionType, chainId, sellTokenAddress, buyTokenAddress, sellAmount, buyAmount, slippageBps)
        : null,
    fetcher,
    {
      onSuccess: (data) => (data.code ? apiErrorCallBack({ status: STATUS.ERROR_API_PRICE, source: "ApiFetcher: ", errCode: data.code, msg: getApiErrorTransactionData(sellTokenAddress, buyTokenAddress, sellAmount, data) }) : setBuyAmount(data.buyAmount || 0n)),
      onError: (error) => apiErrorCallBack({ status: STATUS.ERROR_API_PRICE, source: "ApiFetcher: ", errCode: error.code, msg: error })
    }
  );
}

export { usePriceAPI };