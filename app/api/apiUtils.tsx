const OX_API_KEY:string = process.env.OX_API_KEY === undefined ? "0" : process.env.OX_API_KEY
const FEE_RECIPIENT = process.env.FEE_RECIPIENT_WALLET
const AFFILIATE_FEE = process.env.AFFILIATE_FEE
const FEE_WALLET_DETAILS = `feeRecipient=${FEE_RECIPIENT}&AFFILIATE_FEE=${AFFILIATE_FEE}`
const getURLParams = (url:string) => {
  const urlPart = url.split("?");
  const params = urlPart.length < 2 ? "" :  urlPart[1];
  return params;
}

const apiResponse = async(request:string, urlParms:string) => {
    const apiQuery = `https://${request}?${getURLParams(urlParms)}&${FEE_WALLET_DETAILS}`
    console.debug("====================================================================================================")
    console.debug("OX_API_KEY:                  " + OX_API_KEY)
    console.debug("Executing API Price Request: " + apiQuery)
    console.debug("====================================================================================================")
  
    const response = await fetch(
      apiQuery,
      {
        headers: {
          "0x-api-key": OX_API_KEY, // process.env.NEXT_PUBLIC_0X_API_KEY,
        },
      }
    );
  
    const data = await response.json();
    return new Response(JSON.stringify(data, null, 2))
  }

  export { 
    apiResponse
  }