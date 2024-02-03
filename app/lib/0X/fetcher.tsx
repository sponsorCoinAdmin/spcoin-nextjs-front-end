import { PriceRequestParams } from '../../lib/structure/types'
import qs from "qs";

const SELL_AMOUNT_UNDEFINED = 100;
const BUY_AMOUNT_UNDEFINED = 200;
const SELL_AMOUNT_ZERO = 300;
const BUY_AMOUNT_ZERO = 400;
const ERROR_0X_RESPONSE = 500;

const fetcher = ([endpoint, params]: [string, PriceRequestParams]) => {
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
    console.debug(`${endpoint}?${query}`);
    return fetch(`${endpoint}?${query}`).then((res) => res.json());
  }
  catch (e) {
    throw {errCode: ERROR_0X_RESPONSE, errMsg: JSON.stringify(e, null, 2)}
  }
};

export {
    fetcher,
    SELL_AMOUNT_UNDEFINED,
    BUY_AMOUNT_UNDEFINED,
    SELL_AMOUNT_ZERO,
    BUY_AMOUNT_ZERO,
    ERROR_0X_RESPONSE
}