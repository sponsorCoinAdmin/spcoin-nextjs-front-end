// 'use server'
import { PriceRequestParams, TokenContract, TRANSACTION_TYPE, ErrorMessage } from '@/lib/structure/types'
import qs from "qs";
import useSWR from 'swr';
import { setValidPriceInput, stringifyBigInt } from '../spCoin/utils';
import { exchangeContext } from '../context';

const SELL_AMOUNT_UNDEFINED = 100;
const BUY_AMOUNT_UNDEFINED = 200;
const SELL_AMOUNT_ZERO = 300;
const BUY_AMOUNT_ZERO = 400;
const ERROR_0X_RESPONSE = 500;

const NEXT_PUBLIC_API_SERVER:string|undefined = process.env.NEXT_PUBLIC_API_SERVER

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
    const apiCall = endpoint + '?' + query;
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

const apiCall = exchangeContext.network.name.toLowerCase() + "/0X/price";
// const apiCall = undefined;


type Props = {
  sellTokenContract:TokenContract,
  buyTokenContract:TokenContract,
  transactionType:TRANSACTION_TYPE,
  sellAmount:bigint,
  buyAmount:bigint,
  setPrice: (data:any) => void,
  setBuyAmount: (data:any) => void
  setErrorMessage: (errMsg:ErrorMessage) => void
}

function PriceAPI({
  sellTokenContract, 
  buyTokenContract,
  transactionType,
  sellAmount,
  buyAmount,
  setPrice,
  setBuyAmount,
  setErrorMessage
}:Props) {

  const getPriceApiTransaction = (data:any) => {
    let priceTransaction:string = `Server     : ${process.env.NEXT_PUBLIC_API_SERVER}\n`
              priceTransaction += `apiCall    : ${apiCall}\n`
              priceTransaction += `sellToken  : ${sellTokenContract.address}\n`
              priceTransaction += `buyToken   : ${buyTokenContract.address}\n`
              priceTransaction += `sellAmount : ${sellAmount?.toString()}\n`
              priceTransaction += `data       : ${JSON.stringify(data, null, 2)}`
              return priceTransaction;
  }

  let priceApiCall = (sellAmount === 0n && transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) ||
                     (buyAmount === 0n && transactionType === TRANSACTION_TYPE.BUY_EXACT_IN)? 
                      undefined :
                      [
                        apiCall,
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
          // let dataMsg = `SUCCESS: apiCall => ${getPriceApiTransaction(data)}`
          // console.log(dataMsg)
          // console.debug(`AFTER fetcher data =  + ${JSON.stringify(data,null,2)} + ]`)
          setPrice(data);
          // console.debug(formatUnits(data.buyAmount, buyTokenContract.decimals), data);
          setBuyAmount(data.buyAmount);
        }
        else {
          const errMsg:ErrorMessage = {
            source: "getPriceApiTransaction.priceApiCall.fetcher",
            errCode: data.code,
            msg: "No Error Message",
            // msgArr: undefined,
            // msgObj: undefined
          };
          console.log(`errMsg:ErrorMessage = ${stringifyBigInt(errMsg)}`);
          alert(`${getPriceApiTransaction(data)}`);
          // setErrorMessage(errMsg);
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

// const processError = (
//   error: any, 
//   setErrorMessage:any,
//   buyTokenContract:any,
//   sellTokenContract:any,
//   setBuyAmount:any,
//   setValidPriceInput:any) => {
//   // console.error("***AAA ERROR = " + error + "\n" + JSON.stringify(error, null, 2));
//   let errCode: number = error.errCode;
//   let errMsg: string = error.errMsg;
//   if (errCode !== undefined && error !== null) {
//     switch (errCode) {
//       case SELL_AMOUNT_ZERO: setBuyAmount("0");
//       // console.error("***ZZZ ERROR = " + error + "\n" + JSON.stringify(error, null, 2));

//         break;
//       case BUY_AMOUNT_ZERO: setValidPriceInput("0", buyTokenContract.decimals);
//         break;
//       case ERROR_0X_RESPONSE:
//         setErrorMessage({ name: "ERROR_0X_RESPONSE: " + errCode, message: errMsg });
//         console.error("ERROR_0X_RESPONSE: OX Response errCode = " + errCode + "\nerrMsg = " + errMsg);
//         break;
//       case SELL_AMOUNT_UNDEFINED:
//         setErrorMessage({ name: "SELL_AMOUNT_UNDEFINED: " + errCode, message: errMsg });
//         console.error("SELL_AMOUNT_UNDEFINED: errCode = " + errCode + "\nerrMsg = " + errMsg);
//         setValidPriceInput("0", sellTokenContract.decimals);
//         break;
//       case BUY_AMOUNT_UNDEFINED:
//         setErrorMessage({ name: "BUY_AMOUNT_UNDEFINED: " + errCode, message: errMsg });
//         console.error("BUY_AMOUNT_UNDEFINED: errCode = " + errCode + "\nerrMsg = " + errMsg);
//         setBuyAmount("0");
//         break;
//       default: {
//         setErrorMessage({ name: "DEFAULT ERROR CODE: " + errCode, message: errMsg });
//         console.error("ERROR: errCode = " + errCode + "\nerrMsg = " + errMsg);
//         break;
//       }
//     }
//   }
// };

export {
    fetcher,
    // processError,
    PriceAPI,
    SELL_AMOUNT_UNDEFINED,
    BUY_AMOUNT_UNDEFINED,
    SELL_AMOUNT_ZERO,
    BUY_AMOUNT_ZERO,
    ERROR_0X_RESPONSE
}