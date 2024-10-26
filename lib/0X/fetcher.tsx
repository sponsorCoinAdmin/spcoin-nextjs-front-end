// 'use server'
import { PriceRequestParams, TRANSACTION_TYPE, ErrorMessage } from '@/lib/structure/types'
import qs from "qs";
import useSWR from 'swr';
import { exchangeContext } from '../context';
import { isNetworkProtocolAddress, isTransaction_A_Wrap } from '../network/utils';
import { Address } from 'viem';
import { stringifyBigInt } from '../spCoin/utils';

const SELL_AMOUNT_ZERO = 100;
const BUY_AMOUNT_ZERO = 200;
const ERROR_0X_RESPONSE = 300;

const NEXT_PUBLIC_API_SERVER:string|undefined = process.env.NEXT_PUBLIC_API_SERVER

const apiPriceBase = "/0X/price";
const apiQuoteBase = "/0X/quote";
let apiCall:string;

const WRAPPED_ETHEREUM_ADDRESS ="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

function validTokenOrNetworkCoin(address: any): any {
  if (isNetworkProtocolAddress(address)){
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
    // console.debug(`BEFORE fetcher.apiCall:${apiCall}`);
    let result = fetch(`${apiCall}`).then((res) => res.json());
    // console.debug(`fetcher: ${endpoint}?${query}`);
    // alert("fetcher result = " + JSON.stringify(result,null,2) + "]")
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
  data:any) => {

  let errObj:any = {};
    errObj.ERROR         = `API Call`;
    errObj.Server        = `${process.env.NEXT_PUBLIC_API_SERVER}`
    errObj.netWork       = `${exchangeContext.network.name.toLowerCase()}`
    errObj.apiPriceBase  = `${apiPriceBase}`
    errObj.sellToken     = `${sellTokenAddress}`
    errObj.buyToken      = `${buyTokenAddress}`
    errObj.sellAmount    = `${sellAmount?.toString()}`
    errObj.apiCall       = `${apiCall}`
    errObj.response_data = `${data}`
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
  // if(priceApiCall) {
  //   const apiDataResponse = {
  //     transactionType:(transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) ? `SELL_EXACT_OUT` : `BUY_EXACT_IN`,
  //     sellTokenAddress:sellTokenAddress,
  //     buyTokenAddress:buyTokenAddress,
  //     sellAmount:sellAmount,
  //     buyAmount:buyAmount,
  //     priceApiCall:priceApiCall
  //   }
  //   alert(`priceApiCall = ${stringifyBigInt(apiDataResponse)}`)
  // }
  return priceApiCall;
}

// ToDo This is to turn on off mandatory fetching
const shouldFetch = (sellTokenAddress:Address|undefined, buyTokenAddress:Address|undefined)  => {
  return true;
}

type Props = {
  sellTokenAddress:Address|undefined,
  buyTokenAddress:Address|undefined,
  transactionType:TRANSACTION_TYPE,
  sellAmount:bigint,
  buyAmount:bigint,
  setPriceResponse: (data:any) => void,
  setSellAmount: (sellAmount:bigint) => void,
  setBuyAmount: (buyAmount:bigint) => void,
  // setErrorMessage: (errMsg:ErrorMessage) => void
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
    apiErrorCallBack
  }:Props) {
                        
  return useSWR(
    () => shouldFetch(sellTokenAddress, buyTokenAddress) ? getPriceApiCall(transactionType, sellTokenAddress, buyTokenAddress, sellAmount, buyAmount) : null,
    fetcher,
    {
      onSuccess: (data) => {
        if (!data.code) {
          // let dataMsg = `SUCCESS: apiCall => ${getApiErrorTransactionData(data, sellTokenContract, buyTokenContract, sellAmount)}`
          // console.log(dataMsg)
          // console.debug(`AFTER fetcher data =  + ${JSON.stringify(data,null,2)} + ]`)
          setPriceResponse(data);
          // console.debug(formatUnits(data.buyAmount, buyTokenContract.decimals), data);
          // alert(`useSWR:TRANSACTION_TYPE = ${transactionType}\n amount = ${data.buyAmount}`)
          transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ? 
          setBuyAmount(data.buyAmount || 0) : setSellAmount(data.sellAmount || 0);
        }
        else {
          // if (isNetworkProtocolAddress(sellTokenAddress) || isNetworkProtocolAddress(buyTokenAddress)) {
            if (isTransaction_A_Wrap()) {
            // alert(`ERROR:sellTokenAddress = ${sellTokenAddress}\nbuyTokenAddress = ${buyTokenAddress}\nsellAmount = ${sellAmount}`)
            if(transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT)
              setBuyAmount(sellAmount);
            else if (transactionType === TRANSACTION_TYPE.BUY_EXACT_IN)
              setSellAmount(buyAmount);
            }
            else {if(transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT)
                setBuyAmount(0n);
              else if (transactionType === TRANSACTION_TYPE.BUY_EXACT_IN)
                setSellAmount(BigInt(0));
            const apiErrorObj = getApiErrorTransactionData(data, sellTokenAddress, buyTokenAddress, sellAmount)
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
  fetcher,
  usePriceAPI
}
