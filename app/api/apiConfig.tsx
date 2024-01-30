const OX_API_KEY:string = process.env.OX_API_KEY === undefined ? "0" : process.env.OX_API_KEY
const feeRecipient = process.env.FEE_RECIPIENT_WALLET
const AFFILIATE_FEE = process.env.AFFILIATE_FEE
const feeWalletDetails = `feeRecipient=${feeRecipient}&AFFILIATE_FEE=${AFFILIATE_FEE}`

const getURLParams = (url:string) => {
    const urlPart = url.split("?");
    const params = urlPart.length < 2 ? "" :  urlPart[1];
    return params;
  }

export { getURLParams, OX_API_KEY, feeWalletDetails }