import { PriceRequestParams } from '@/lib/structure/types'
import qs from "qs";

const SELL_AMOUNT_UNDEFINED = 100;
const BUY_AMOUNT_UNDEFINED = 200;
const SELL_AMOUNT_ZERO = 300;
const BUY_AMOUNT_ZERO = 400;
const ERROR_0X_RESPONSE = 500;

const fetcher = ([endpoint, params]: [string, PriceRequestParams]) => {
  const { sellAmount, buyAmount } = params;

  if (!sellAmount && !buyAmount) return;
  // console.debug("fetcher")
  if (!buyAmount && (sellAmount === undefined || sellAmount === "0")) {
    throw {errCode: SELL_AMOUNT_ZERO, errMsg: 'Fetcher not executing remote price call: Sell Amount is 0'};
  }
  if (!sellAmount && buyAmount === "0") {
    throw {errCode: BUY_AMOUNT_ZERO, errMsg: 'Fetcher not executing remote price call: Buy Amount is 0'}
  }

  try {
    console.debug("fetcher([endpoint = " + endpoint + ",params = " + JSON.stringify(params,null,2) + "]")
    const query = qs.stringify(params);
    // alert(`BEFORE fetcher:${endpoint}?${query}`);
    let result = fetch(`${endpoint}?${query}`).then((res) => res.json());
    console.debug(`fetcher: ${endpoint}?${query}`);
    // alert(`AFTER fetcher result =  + ${JSON.stringify(result,null,2)} + ]`)
    // console.debug("fetcher result = " + JSON.stringify(result,null,2) + "]")
    return result
  }
  catch (e) {
    alert("fetcher Error: "+JSON.stringify(e, null, 2))
    throw {errCode: ERROR_0X_RESPONSE, errMsg: JSON.stringify(e, null, 2)}
  }
};

const processError = (
  error: any, 
  setErrorMessage:any,
  buyTokenContract:any,
  sellTokenContract:any,
  setBuyAmount:any,
  setValidPriceInput:any) => {
  // console.error("***AAA ERROR = " + error + "\n" + JSON.stringify(error, null, 2));
  let errCode: number = error.errCode;
  let errMsg: string = error.errMsg;
  if (errCode !== undefined && error !== null) {
    switch (errCode) {
      case SELL_AMOUNT_ZERO: setBuyAmount("0");
      // console.error("***ZZZ ERROR = " + error + "\n" + JSON.stringify(error, null, 2));

        break;
      case BUY_AMOUNT_ZERO: setValidPriceInput("0", buyTokenContract.decimals);
        break;
      case ERROR_0X_RESPONSE:
        setErrorMessage({ name: "ERROR_0X_RESPONSE: " + errCode, message: errMsg });
        console.error("ERROR_0X_RESPONSE: OX Response errCode = " + errCode + "\nerrMsg = " + errMsg);
        break;
      case SELL_AMOUNT_UNDEFINED:
        setErrorMessage({ name: "SELL_AMOUNT_UNDEFINED: " + errCode, message: errMsg });
        console.error("SELL_AMOUNT_UNDEFINED: errCode = " + errCode + "\nerrMsg = " + errMsg);
        setValidPriceInput("0", sellTokenContract.decimals);
        break;
      case BUY_AMOUNT_UNDEFINED:
        setErrorMessage({ name: "BUY_AMOUNT_UNDEFINED: " + errCode, message: errMsg });
        console.error("BUY_AMOUNT_UNDEFINED: errCode = " + errCode + "\nerrMsg = " + errMsg);
        setBuyAmount("0");
        break;
      default: {
        setErrorMessage({ name: "DEFAULT ERROR CODE: " + errCode, message: errMsg });
        console.error("ERROR: errCode = " + errCode + "\nerrMsg = " + errMsg);
        break;
      }
    }
  }
};

export {
    fetcher,
    processError,
    SELL_AMOUNT_UNDEFINED,
    BUY_AMOUNT_UNDEFINED,
    SELL_AMOUNT_ZERO,
    BUY_AMOUNT_ZERO,
    ERROR_0X_RESPONSE
}