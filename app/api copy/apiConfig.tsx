const OX_API_KEY:string = process.env.OX_API_KEY === undefined ? "0" : process.env.OX_API_KEY
const FEE_RECIPIENT = process.env.FEE_RECIPIENT_WALLET
const AFFILIATE_FEE = process.env.AFFILIATE_FEE
const FEE_WALLET_DETAILS = `FEE_RECIPIENT=${FEE_RECIPIENT}&AFFILIATE_FEE=${AFFILIATE_FEE}`

const priceApi="/swap/v1/price"
const quoteApi="/swap/v1/quote"

const getURLParams = (url:string) => {
    const urlPart = url.split("?");
    const params = urlPart.length < 2 ? "" :  urlPart[1];
    return params;
  }

export { getURLParams, OX_API_KEY, FEE_WALLET_DETAILS }