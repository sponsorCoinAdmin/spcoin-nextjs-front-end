// 'use server'
import { PriceRequestParams, TRANSACTION_TYPE, ErrorMessage, HARDHAT } from '@/lib/structure/types';
import qs from "qs";
import useSWR from 'swr';
import { exchangeContext } from '../context';
import { isActiveAccountAddress, isWrappingTransaction, mapAccountAddrToWethAddr } from '../network/utils';
import { Address } from 'viem';
import { PriceResponse } from '@/app/api/types';
import { useAccount, useChainId } from "wagmi";

// Constants
const SELL_AMOUNT_ZERO = 100;
const BUY_AMOUNT_ZERO = 200;
const ERROR_0X_RESPONSE = 300;
const WRAPPED_ETHEREUM_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

// Configurations
const NEXT_PUBLIC_API_SERVER = process.env.NEXT_PUBLIC_API_SERVER;
const apiPriceBase = "/0X/price";
const apiQuoteBase = "/0X/quote";

// The chain ID can be dynamically obtained when needed
let chainId = exchangeContext.tradeData.chainId || 1; // Default to 1 if undefined

// API Call Reference
let apiCall: string | undefined;



function validTokenOrNetworkCoin(address: any): any {
  if (isActiveAccountAddress(address)){
    return WRAPPED_ETHEREUM_ADDRESS;
  } else
    return address;
}

const fetcher = ([endpoint, params]: [string, PriceRequestParams]) => {
  endpoint = NEXT_PUBLIC_API_SERVER + endpoint
  let { sellAmount, buyAmount } = params;

  if (!sellAmount && !buyAmount) return;

  if (!sellAmount && buyAmount === "0") {
    throw {errCode: BUY_AMOUNT_ZERO, errMsg: 'Fetcher not executing remote price call: Buy Amount is 0'}
  }

  if (!buyAmount && (sellAmount === undefined || sellAmount === "0")) {
    throw {errCode: SELL_AMOUNT_ZERO, errMsg: 'Fetcher not executing remote price call: Sell Amount is 0'};
  }

try {
    // console.debug("fetcher([endpoint = " + endpoint + ",params = " + JSON.stringify(params,null,2) + "]")
    const query = qs.stringify(params);
    apiCall = endpoint + '?' + query;
    let result = fetch(`${apiCall}`).then((res) => res.json());
    console.debug(`fetcher:apiCall ${apiCall}`);
    return result
  }
  catch (e) {
    alert("fetcher Error: "+JSON.stringify(e, null, 2))
    throw {errCode: ERROR_0X_RESPONSE, errMsg: JSON.stringify(e, null, 2)}
  }
}

const getApiErrorTransactionData = (
  sellTokenAddress:Address|undefined,
  buyTokenAddress:Address|undefined,
  sellAmount:any,
  data:PriceResponse) => {

  let errObj:any = {};
    errObj.ERROR            = `API Call`;
    errObj.Server           = `${process.env.NEXT_PUBLIC_API_SERVER}`
    errObj.netWork          = `${exchangeContext.network.name.toLowerCase()}`
    errObj.apiPriceBase     = `${apiPriceBase}`
    errObj.sellTokenAddress = `${sellTokenAddress}`
    errObj.buyTokenAddress  = `${buyTokenAddress}`
    errObj.sellAmount       = `${sellAmount}`
    errObj.apiCall          = `${apiCall}`
    errObj.response_data    = `${data}`
  return errObj;
}

const getPriceApiCall = (transactionType:any, sellTokenAddress:Address|undefined, buyTokenAddress:Address|undefined, sellAmount:any, buyAmount:any) => {
  let priceApiCall = (sellAmount === 0n && transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) ||
                     (buyAmount === 0n && transactionType === TRANSACTION_TYPE.BUY_EXACT_IN)? 
                      undefined :
                      [
                        exchangeContext.network.name.toLowerCase() + apiPriceBase,
                        {
                          sellToken: validTokenOrNetworkCoin(sellTokenAddress),
                          buyToken: validTokenOrNetworkCoin(buyTokenAddress),
                          sellAmount: (transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) ? sellAmount.toString() : undefined,
                          buyAmount: (transactionType ===  TRANSACTION_TYPE.BUY_EXACT_IN) ? buyAmount.toString() : undefined,
                          // The Slippage does not seam to pass check the api parameters with a JMeter Test then implement here
                          // slippagePercentage: slippage,
                          // expectedSlippage: slippage
                        },
                      ];
  if(priceApiCall) {
    // const apiDataResponse = {
    //   transactionType:(transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) ? `SELL_EXACT_OUT` : `BUY_EXACT_IN`,
    //   sellTokenAddress:sellTokenAddress,
    //   buyTokenAddress:buyTokenAddress,
    //   sellAmount:sellAmount,
    //   buyAmount:buyAmount,
    //   priceApiCall:priceApiCall
    // }
    // alert(`apiDataResponse = ${stringifyBigInt(apiDataResponse)}`)
    // alert(`priceApiCall = ${stringifyBigInt(priceApiCall)}`)
  }
  return priceApiCall;
}

const shouldFetch = (sellTokenAddress?: Address, buyTokenAddress?: Address): boolean => {
  console.log(`fetcher.shouldFetch.chainId = ${chainId}`);
  return sellTokenAddress !== buyTokenAddress && chainId !== HARDHAT;
};

type Props = {
  sellTokenAddress?: Address;
  buyTokenAddress?: Address;
  transactionType: TRANSACTION_TYPE;
  sellAmount: bigint;
  buyAmount: bigint;
  setSellAmount: (amount: bigint) => void;
  setBuyAmount: (amount: bigint) => void;
  setErrorMessage: (message?: ErrorMessage) => void;
  apiErrorCallBack: (error: unknown) => void;
};

function usePriceAPI({
    sellTokenAddress, 
    buyTokenAddress,
    transactionType,
    sellAmount,
    buyAmount,
    setSellAmount,
    setBuyAmount,
    setErrorMessage,
    apiErrorCallBack
  } : Props) {

  sellTokenAddress = mapAccountAddrToWethAddr(sellTokenAddress as Address)
  buyTokenAddress = mapAccountAddrToWethAddr(buyTokenAddress as Address)
  chainId=useChainId();
  const fetch = shouldFetch(sellTokenAddress, buyTokenAddress)
  const priceApiCall = getPriceApiCall(transactionType, sellTokenAddress, buyTokenAddress, sellAmount, buyAmount)
                        
  return useSWR(
    () => shouldFetch(sellTokenAddress, buyTokenAddress) ?
    getPriceApiCall(transactionType, sellTokenAddress, buyTokenAddress, sellAmount, buyAmount) :
    null,
    fetcher,
    {
      onSuccess: (data) => {
        if (!data.code) {
          // console.log(dataMsg)
          console.debug(`AFTER fetcher data = ${JSON.stringify(data,null,2)}`)
          transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ? 
            console.debug(`SUCCESS SELL_EXACT_OUT: useSWR.fetcher data.price = ${data.price}`):
            console.debug(`SUCCESS BUY_EXACT_IN: useSWR.fetcher data.price = ${data.price}`);
          console.debug(`data.price      = ${data.price}\n
                         data.sellAmount = ${data.sellAmount}\n
                         data.buyAmount  = ${data.buyAmount}`);
            
          transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ? 
            
            setBuyAmount(data.buyAmount || 0n) : 
            setSellAmount(data.sellAmount || 0n);
            setErrorMessage(undefined)
        }
        else {
          if (isWrappingTransaction(sellTokenAddress, buyTokenAddress)) {

            // alert(`ERROR:sellTokenAddress = ${sellTokenAddress}\nbuyTokenAddress = ${buyTokenAddress}\nsellAmount = ${sellAmount}`)
            if (transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) {
              exchangeContext.tradeData.sellAmount = sellAmount
              setBuyAmount(sellAmount);
            }
            else if (transactionType === TRANSACTION_TYPE.BUY_EXACT_IN) {
              exchangeContext.tradeData.sellAmount = buyAmount
              setSellAmount(buyAmount);
            }
          }
          else if (chainId != HARDHAT) {
            if (transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) {
              exchangeContext.tradeData.sellAmount = buyAmount
              setBuyAmount(0n);
            }
            else if (transactionType === TRANSACTION_TYPE.BUY_EXACT_IN) {
              exchangeContext.tradeData.sellAmount = sellAmount
              setSellAmount(BigInt(0));
            }
          }
          else { // Return Error
            const apiErrorObj = getApiErrorTransactionData(sellTokenAddress, buyTokenAddress, sellAmount, data)
              apiErrorCallBack({ source: "ApiFetcher: ", errCode: data.code, msg: apiErrorObj });
          }
        
        }
      },
    // if (isActiveAccountAddress(sellTokenAddress) || isActiveAccountAddress(buyTokenAddress)) {
      onError: (error) => {
        // if (isWrappingTransaction(sellTokenAddress, buyTokenAddress)) {

        //   // alert(`ERROR:sellTokenAddress = ${sellTokenAddress}\nbuyTokenAddress = ${buyTokenAddress}\nsellAmount = ${sellAmount}`)
        //   if (transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) {
        //     exchangeContext.tradeData.sellAmount = sellAmount
        //     setBuyAmount(sellAmount);
        //   }
        //   else if (transactionType === TRANSACTION_TYPE.BUY_EXACT_IN) {
        //     exchangeContext.tradeData.sellAmount = buyAmount
        //     setSellAmount(buyAmount);
        //   }
        // }
        // else if (chainId != HARDHAT) {
        //   if (transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) {
        //     exchangeContext.tradeData.sellAmount = buyAmount
        //     setBuyAmount(0n);
        //   }
        //   else if (transactionType === TRANSACTION_TYPE.BUY_EXACT_IN) {
        //     exchangeContext.tradeData.sellAmount = sellAmount
        //     setSellAmount(BigInt(0));
        //   }
        // }
    }

     }
  );
  
  if (isWrappingTransaction(sellTokenAddress, buyTokenAddress)) {
    // alert(`ERROR:sellTokenAddress = ${sellTokenAddress}\nbuyTokenAddress = ${buyTokenAddress}\nsellAmount = ${sellAmount}`)
    if (transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) {
      exchangeContext.tradeData.sellAmount = sellAmount
      setBuyAmount(sellAmount);
    }
    else if (transactionType === TRANSACTION_TYPE.BUY_EXACT_IN) {
      exchangeContext.tradeData.sellAmount = buyAmount
      setSellAmount(buyAmount);
    }
  }

}

export {
  usePriceAPI
}
