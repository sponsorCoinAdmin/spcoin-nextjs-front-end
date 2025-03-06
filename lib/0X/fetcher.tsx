// 'use server'
import { PriceRequestParams, TRANSACTION_TYPE, ErrorMessage, HARDHAT, STATUS } from '@/lib/structure/types';
import qs from "qs";
import useSWR from 'swr';
import { exchangeContext } from "../context";
import { isActiveAccountAddress, isWrappingTransaction, mapAccountAddrToWethAddr } from '../network/utils';
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
// const apiPriceBase = "/0X/price";
// const apiQuoteBase = "/0X/quote";
const apiPriceBase = "/price";
const apiQuoteBase = "/quote";

// The chain ID can be dynamically obtained when needed
let chainId = exchangeContext.tradeData.chainId || 1; // Default to 1 if undefined

// API Call Reference
let apiCall: string | undefined;

function validTokenOrNetworkCoin(address: any): any {
  if (isActiveAccountAddress(address)) {
    return WRAPPED_ETHEREUM_ADDRESS;
  } else
    return address;
}

const fetcher = ([endpoint, params]: [string, PriceRequestParams]) => {
  endpoint = NEXT_PUBLIC_API_SERVER + endpoint
  let { sellAmount, buyAmount } = params;

  if (!sellAmount && !buyAmount) return;

  if (!sellAmount && buyAmount === "0") {
    throw { errCode: BUY_AMOUNT_ZERO, errMsg: 'Fetcher not executing remote price call: Buy Amount is 0' }
  }

  if (!buyAmount && (sellAmount === undefined || sellAmount === "0")) {
    throw { errCode: SELL_AMOUNT_ZERO, errMsg: 'Fetcher not executing remote price call: Sell Amount is 0' };
  }

  try {
    const query = qs.stringify(params);
    const apiCall = `${endpoint}?${query}`;
    let result = fetch(`${apiCall}`).then((res) => res.json());
    console.debug(`fetcher: apiCall ${apiCall}`);
    return result
  }
  catch (e) {
    alert("fetcher Error: " + JSON.stringify(e, null, 2))
    throw { errCode: ERROR_0X_RESPONSE, errMsg: JSON.stringify(e, null, 2) }
  }
}

const getApiErrorTransactionData = (
  sellTokenAddress: Address | undefined,
  buyTokenAddress: Address | undefined,
  sellAmount: any,
  data: PriceResponse) => {

  let errObj: any = {};
  errObj.ERROR = `API Call`;
  errObj.Server = `${process.env.NEXT_PUBLIC_API_SERVER}`
  errObj.netWork = `${exchangeContext.network.name.toLowerCase()}`
  errObj.apiPriceBase = `${apiPriceBase}`
  errObj.sellTokenAddress = `${sellTokenAddress}`
  errObj.buyTokenAddress = `${buyTokenAddress}`
  errObj.sellAmount = `${sellAmount}`
  errObj.apiCall = `${apiCall}`
  errObj.response_data = `${data}`
  return errObj;
}

const getPriceApiCall = (
  transactionType: TRANSACTION_TYPE,
  chainId: number,
  sellTokenAddress: Address | undefined,
  buyTokenAddress: Address | undefined,
  sellAmount: bigint,
  buyAmount: bigint,
  slippageBps?: number ) => {
  // chainId = useChainId();

  const priceApiCall = (sellAmount === 0n && transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) ||
    (buyAmount === 0n && transactionType === TRANSACTION_TYPE.BUY_EXACT_IN) ?
    undefined :
    [
      // exchangeContext.network.name.toLowerCase() + apiPriceBase,
      apiPriceBase,
      {
        chainId: chainId,
        sellToken: validTokenOrNetworkCoin(sellTokenAddress),
        buyToken: validTokenOrNetworkCoin(buyTokenAddress),
        sellAmount: (transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) ? sellAmount.toString() : undefined,
        buyAmount: (transactionType === TRANSACTION_TYPE.BUY_EXACT_IN) ? buyAmount.toString() : undefined,
        slippageBps: slippageBps
        // The Slippage does not seam to pass check the api parameters with a JMeter Test then implement here
        // slippagePercentage: slippage,
        // expectedSlippage: slippage
      },
    ];
  return priceApiCall;
}

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

  sellTokenAddress = mapAccountAddrToWethAddr(sellTokenAddress as Address)
  buyTokenAddress = mapAccountAddrToWethAddr(buyTokenAddress as Address)

  const handleError = (data: any) => {
    const apiErrorObj = getApiErrorTransactionData(sellTokenAddress, buyTokenAddress, sellAmount, data);
    apiErrorCallBack({ status: STATUS.ERROR_API_PRICE, source: "ApiFetcher: ", errCode: data.code, msg: apiErrorObj });
  };

  const processData = (data: any, transactionType: TRANSACTION_TYPE) => {
    logSuccess(data, transactionType);
    transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ?
      setBuyAmount(data.buyAmount || 0n) :
      setSellAmount(data.sellAmount || 0n);
    setErrorMessage(undefined);
  }

  const logSuccess = (data: any, transactionType: TRANSACTION_TYPE) => {
    const type = transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ? "SELL_EXACT_OUT" : "BUY_EXACT_IN";
    console.debug(`AFTER fetcher data = ${JSON.stringify(data, null, 2)}`);
    console.debug(`SUCCESS ${type}: useSWR.fetcher data.price = ${data.price}`);
    console.debug(`data.price = ${data.price}\ndata.sellAmount = ${data.sellAmount}\ndata.buyAmount = ${data.buyAmount}`);
  };

  chainId = useChainId();

  const shouldFetch = (sellTokenAddress?: Address | undefined, buyTokenAddress?: Address | undefined): boolean => {
    console.log(`fetcher.shouldFetch.chainId = ${chainId}`);
    const shouldFetch: boolean =
      (sellTokenAddress != undefined) &&
      (buyTokenAddress != undefined) &&
      (sellTokenAddress !== buyTokenAddress) &&
      (chainId !== HARDHAT);
    return shouldFetch;
  };


  // slippageBps = 100;
  return useSWR(
    () => shouldFetch(sellTokenAddress, buyTokenAddress) ?
      getPriceApiCall(
        transactionType,
        chainId,
        sellTokenAddress,
        buyTokenAddress,
        sellAmount,
        buyAmount,
        slippageBps) : null,
    fetcher,
    {
      onSuccess: (data) => (data.code ? handleError(data) : processData(data, transactionType)),
      onError: (error) => { handleError(error) }
    }
  );
}

export {
  usePriceAPI
}
