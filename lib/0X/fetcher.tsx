// 'use server'
import { PriceRequestParams, TokenContract, TRANSACTION_TYPE, ErrorMessage } from '@/lib/structure/types'
import qs from "qs";
import useSWR from 'swr';
import { exchangeContext } from '../context';

const BUY_AMOUNT_UNDEFINED = 200;
const SELL_AMOUNT_ZERO = 300;
const BUY_AMOUNT_ZERO = 400;
const ERROR_0X_RESPONSE = 500;

const NEXT_PUBLIC_API_SERVER:string|undefined = process.env.NEXT_PUBLIC_API_SERVER

const apiPriceBase = "/0X/price";
const apiQuoteBase = "/0X/quote";
let apiCall:string;

const fetcher = ([endpoint, params]: [string, PriceRequestParams]) => {
  endpoint = NEXT_PUBLIC_API_SERVER + endpoint
  const { sellAmount, buyAmount } = params;

  if (!sellAmount && !buyAmount) return;
  if (!buyAmount && (sellAmount === undefined || sellAmount === "0")) {
    throw {errCode: SELL_AMOUNT_ZERO, errMsg: 'Fetcher not executing remote price call: Sell Amount is 0'};
  }
  if (!sellAmount && buyAmount === "0") {
    throw {errCode: BUY_AMOUNT_ZERO, errMsg: 'Fetcher not executing remote price call: Buy Amount is 0'}
  }

  try {
    console.debug("fetcher([endpoint = " + endpoint + ",params = " + JSON.stringify(params,null,2) + "]")
    const query = qs.stringify(params);
    apiCall = endpoint + '?' + query;
    console.debug(`BEFORE fetcher.apiCall:${apiCall}`);
    let result = fetch(`${apiCall}`).then((res) => res.json());
    // console.debug(`fetcher: ${endpoint}?${query}`);
    // alert("fetcher result = " + JSON.stringify(result,null,2) + "]")
    return result
  }
  catch (e) {
    alert("fetcher Error: "+JSON.stringify(e, null, 2))
    throw {errCode: ERROR_0X_RESPONSE, errMsg: JSON.stringify(e, null, 2)}
  }
};


type Props = {
  sellTokenContract:TokenContract,
  buyTokenContract:TokenContract,
  transactionType:TRANSACTION_TYPE,
  sellAmount:bigint,
  buyAmount:bigint,
  setPrice: (data:any) => void,
  setBuyAmount: (data:any) => void
  // setErrorMessage: (errMsg:ErrorMessage) => void
  apiErrorCallBack: (apiErrorObj:any) => void
}

function PriceAPI({
  sellTokenContract, 
  buyTokenContract,
  transactionType,
  sellAmount,
  buyAmount,
  setPrice,
  setBuyAmount,
  apiErrorCallBack
}:Props) {

  const getApiErrorTransactionData = (data:any) => {
    let priceTransaction:string = `ERROR        : API Call\n`
              priceTransaction += `Server       : ${process.env.NEXT_PUBLIC_API_SERVER}\n`
              priceTransaction += `netWork      : ${exchangeContext.network.name.toLowerCase()}\n`
              priceTransaction += `apiPriceBase : ${apiPriceBase}\n`
              priceTransaction += `sellToken    : ${sellTokenContract.address}\n`
              priceTransaction += `buyToken     : ${buyTokenContract.address}\n`
              priceTransaction += `sellAmount   : ${sellAmount?.toString()}\n`
              priceTransaction += `apiCall      : ${apiCall}\n`
              priceTransaction += `response data: ${JSON.stringify(data, null, 2)}`
    return priceTransaction;
  }

  let priceApiCall = (sellAmount === 0n && transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) ||
                     (buyAmount === 0n && transactionType === TRANSACTION_TYPE.BUY_EXACT_IN)? 
                      undefined :
                      [
                        exchangeContext.network.name.toLowerCase() + apiPriceBase,
                        {
                          sellToken: sellTokenContract.address,
                          buyToken: buyTokenContract.address,
                          sellAmount: (transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) ? sellAmount.toString() : undefined,
                          buyAmount: (transactionType ===  TRANSACTION_TYPE.BUY_EXACT_IN) ? buyAmount.toString() : undefined,
                          // The Slippage does not seam to pass check the api parameters with a JMeter Test then implement here
                          // slippagePercentage: slippage,
                          // expectedSlippage: slippage
                        },
                      ];
                        
  return useSWR(
    priceApiCall,
    fetcher,
    {
      onSuccess: (data) => {
        if (!data.code) {
          // let dataMsg = `SUCCESS: apiCall => ${getApiErrorTransactionData(data)}`
          // console.log(dataMsg)
          // console.debug(`AFTER fetcher data =  + ${JSON.stringify(data,null,2)} + ]`)
          setPrice(data);
          // console.debug(formatUnits(data.buyAmount, buyTokenContract.decimals), data);
          setBuyAmount(data.buyAmount);
        }
        else {
          const apiErrorObj = getApiErrorTransactionData(data)
          apiErrorCallBack(apiErrorObj);
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
    // processError,
    PriceAPI,
    BUY_AMOUNT_UNDEFINED,
    SELL_AMOUNT_ZERO,
    BUY_AMOUNT_ZERO,
    ERROR_0X_RESPONSE
}