const OX_API_KEY:string = process.env.OX_API_KEY === undefined ? "0" : process.env.OX_API_KEY
const FEE_RECIPIENT = process.env.FEE_RECIPIENT_WALLET
const AFFILIATE_FEE = process.env.AFFILIATE_FEE
const FEE_WALLET_DETAILS = `feeRecipient=${FEE_RECIPIENT}&AFFILIATE_FEE=${AFFILIATE_FEE}`

export { OX_API_KEY, FEE_WALLET_DETAILS }