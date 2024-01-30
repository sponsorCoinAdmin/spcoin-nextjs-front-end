import { OX_API_KEY, FEE_WALLET_DETAILS } from './apiConfig'

const getURLParams = (url:string) => {
  const urlPart = url.split("?");
  const params = urlPart.length < 2 ? "" :  urlPart[1];
  return params;
}

const apiResponse = async(apiQuery:string) => {
    apiQuery += `&${FEE_WALLET_DETAILS}`
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
    getURLParams,
    apiResponse
  }