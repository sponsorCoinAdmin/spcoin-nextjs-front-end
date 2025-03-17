import { PriceRequestParams, TRANS_DIRECTION, ErrorMessage, HARDHAT, STATUS } from '@/lib/structure/types';
import qs from "qs";
import useSWR from 'swr';
import { useBuyAmount, useExchangeContext, useSellAmount, useTradeData } from '@/lib/context/ExchangeContext';
import { useIsActiveAccountAddress, useMapAccountAddrToWethAddr } from '../network/utils';
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

// ✅ Fix: Ensure hooks are NOT inside this function
const validTokenOrNetworkCoin = (address: Address, isActiveAccount: boolean): Address => {
  return isActiveAccount ? WRAPPED_ETHEREUM_ADDRESS : address;
};

// ✅ Fix: Ensure hooks are NOT inside this function
const fetcher = async ([endpoint, params]: [string, PriceRequestParams]) => {
  endpoint = NEXT_PUBLIC_API_SERVER + endpoint;
  const { sellAmount, buyAmount } = params;

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
    console.debug(`fetcher: apiCall ${apiCall}`);
    const response = await fetch(apiCall);
    return response.json();
  } catch (e) {
    console.error("fetcher Error: ", e);
    throw { errCode: ERROR_0X_RESPONSE, errMsg: JSON.stringify(e, null, 2) };
  }
};

// ✅ Fix: Pass `exchangeContext` as an argument instead of calling `useExchangeContext` inside the function
const getApiErrorTransactionData = (
  exchangeContext: any, // Pass exchangeContext
  sellTokenAddress: Address | undefined,
  buyTokenAddress: Address | undefined,
  sellAmount: any,
  data: PriceResponse
) => {
  return {
    ERROR: `API Call`,
    Server: `${process.env.NEXT_PUBLIC_API_SERVER}`,
    netWork: `${exchangeContext.network.name.toLowerCase()}`, // ✅ Now using passed context instead of a hook
    apiPriceBase: `${apiPriceBase}`,
    sellTokenAddress: `${sellTokenAddress}`,
    buyTokenAddress: `${buyTokenAddress}`,
    sellAmount: `${sellAmount}`,
    response_data: `${data}`
  };
};

const getPriceApiCall = (
  transactionType: TRANS_DIRECTION,
  chainId: number,
  sellTokenAddress: Address | undefined,
  buyTokenAddress: Address | undefined,
  sellAmount: bigint,
  buyAmount: bigint,
  slippageBps?: number
) => {
  return (sellAmount === 0n && transactionType === TRANS_DIRECTION.SELL_EXACT_OUT) ||
    (buyAmount === 0n && transactionType === TRANS_DIRECTION.BUY_EXACT_IN)
    ? undefined
    : [
        apiPriceBase,
        {
          chainId: chainId,
          sellToken: sellTokenAddress,
          buyToken: buyTokenAddress,
          sellAmount: transactionType === TRANS_DIRECTION.SELL_EXACT_OUT ? sellAmount.toString() : undefined,
          buyAmount: transactionType === TRANS_DIRECTION.BUY_EXACT_IN ? buyAmount.toString() : undefined,
          slippageBps: slippageBps
        },
      ];
};

type Props = {
  sellTokenAddress?: Address;
  buyTokenAddress?: Address;
  // setSellAmount: (amount: bigint) => void;
  // setBuyAmount: (amount: bigint) => void;
  setErrorMessage: (message?: ErrorMessage) => void;
  apiErrorCallBack: (error: ErrorMessage) => void;
};

function usePriceAPI({
  sellTokenAddress: initialSellTokenAddress,
  buyTokenAddress: initialBuyTokenAddress,
  // setSellAmount,
  // setBuyAmount,
  setErrorMessage,
  apiErrorCallBack
}: Props) {
  // ✅ Hooks MUST be at the top level
  const { exchangeContext } = useExchangeContext();
  const tradeData = useTradeData();
  const chainId = useChainId();

  // ✅ Convert addresses *after* hooks are defined
  const isActiveSellAccount = useIsActiveAccountAddress(initialSellTokenAddress as Address);
  const isActiveBuyAccount = useIsActiveAccountAddress(initialBuyTokenAddress as Address);

  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [sellAmount, setSellAmount] = useSellAmount();
  
  const sellTokenAddress = useMapAccountAddrToWethAddr(validTokenOrNetworkCoin(initialSellTokenAddress as Address, isActiveSellAccount));
  const buyTokenAddress = useMapAccountAddrToWethAddr(validTokenOrNetworkCoin(initialBuyTokenAddress as Address, isActiveBuyAccount));

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
        ? getPriceApiCall(
          tradeData.transactionType,
          chainId,
          sellTokenAddress,
          buyTokenAddress,
          sellAmount,
          buyAmount,
          tradeData.slippageBps)
        : null,
    fetcher,
    {
      onSuccess: (data) =>
        data.code
          ? apiErrorCallBack({
              status: STATUS.ERROR_API_PRICE,
              source: "ApiFetcher: ",
              errCode: data.code,
              msg: getApiErrorTransactionData(
                exchangeContext,
                sellTokenAddress,
                buyTokenAddress,
                sellAmount,
                data), // ✅ Fix: pass exchangeContext
            })
          : setBuyAmount(data.buyAmount || 0n),
      onError: (error) =>
        apiErrorCallBack({
          status: STATUS.ERROR_API_PRICE,
          source: "ApiFetcher: ",
          errCode: error.code,
          msg: error,
        }),
    }
  );
}

export { usePriceAPI };
