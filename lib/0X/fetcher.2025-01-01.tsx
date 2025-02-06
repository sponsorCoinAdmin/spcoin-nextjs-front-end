// 'use server'
import { PriceRequestParams, TRANSACTION_TYPE, ErrorMessage } from '@/lib/structure/types'
import qs from "qs";
import useSWR from 'swr';
import { exchangeContext } from '../context';
import { isActiveAccountAddress, isWrappingTransaction } from '../network/utils';
import { Address } from 'viem';
import { PriceResponse } from '@/app/api/types';
import { useChainId } from "wagmi";


const SELL_AMOUNT_ZERO = 100;
const BUY_AMOUNT_ZERO = 200;
const ERROR_0X_RESPONSE = 300;

const NEXT_PUBLIC_API_SERVER:string|undefined = process.env.NEXT_PUBLIC_API_SERVER

const apiPriceBase = "/0X/price";
const apiQuoteBase = "/0X/quote";
let apiCall:string;

const WRAPPED_ETHEREUM_ADDRESS ="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

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
let chainId:number
// ToDo This is to turn on off mandatory fetching
const shouldFetch = (sellTokenAddress:Address|undefined, buyTokenAddress:Address|undefined)  => {
  chainId = useChainId();
  console.log(`fetcher.shouldFetch.chainId = ${chainId}`)
  if (chainId === 31337)
  {
    console.log(`fetcher.shouldFetch returning FALSE`)
    return false
  }
  return true;
}

type Props = {
  sellTokenAddress:Address|undefined,
  buyTokenAddress:Address|undefined,
  transactionType:TRANSACTION_TYPE,
  sellAmount:bigint,
  buyAmount:bigint,
  setPriceResponse: (data:PriceResponse) => void,
  setSellAmount: (sellAmount:bigint) => void,
  setBuyAmount: (buyAmount:bigint) => void,
  setErrorMessage: (errMsg:ErrorMessage|undefined) => void
  apiErrorCallBack: (apiErrorObj:any) => void
}

function usePriceAPI({
    sellTokenAddress, 
    buyTokenAddress,
    transactionType,
    sellAmount,
    buyAmount,
    setPriceResponse,
    setSellAmount,
    setBuyAmount,
    setErrorMessage,
    apiErrorCallBack
  }:Props) {
                        
  return useSWR(
    () => shouldFetch(sellTokenAddress, buyTokenAddress) ? getPriceApiCall(transactionType, sellTokenAddress, buyTokenAddress, sellAmount, buyAmount) : null,
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
            
          setPriceResponse(data);

          transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ? 
            // setBuyAmount(data.price) : setSellAmount(data.price);
            // setBuyAmount(BigInt(data.price)) : setSellAmount(BigInt(data.price));
            setBuyAmount(data.buyAmount || 0n) : 
            setSellAmount(data.sellAmount || 0n);
            setErrorMessage(undefined)
        }
        else {
          // if (isActiveAccountAddress(sellTokenAddress) || isActiveAccountAddress(buyTokenAddress)) {
            if (isWrappingTransaction()) {
            // alert(`ERROR:sellTokenAddress = ${sellTokenAddress}\nbuyTokenAddress = ${buyTokenAddress}\nsellAmount = ${sellAmount}`)
            if(transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT)
              setBuyAmount(sellAmount);
            else if (transactionType === TRANSACTION_TYPE.BUY_EXACT_IN)
              setSellAmount(buyAmount);
            }
            else if (chainId != 31337) {
              if(transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT)
                  setBuyAmount(0n);
                else if (transactionType === TRANSACTION_TYPE.BUY_EXACT_IN)
                  setSellAmount(BigInt(0));
              const apiErrorObj = getApiErrorTransactionData(sellTokenAddress, buyTokenAddress, sellAmount, data)
              apiErrorCallBack({ source: "ApiFetcher: ", errCode:data.code, msg: apiErrorObj });
            }
        }
      },
      // onError: (error) => {
        // processError(
        //   error,
        //   setErrorMessage,
        //   buyTokenContract,
        //   sellTokenContract,
        //   setBuyAmount,
        //   setValidPriceInput
        // );
      // }
    }
  );
}

export {
  usePriceAPI
}
