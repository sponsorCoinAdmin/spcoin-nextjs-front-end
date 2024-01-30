import { OX_API_KEY } from './polygon/networkConfig'

const getURLParams = (url:string) => {
  const urlPart = url.split("?");
  const params = urlPart.length < 2 ? "" :  urlPart[1];
  return params;
}

const apiResponse = async(apiQuery:string) => {
    console.log("====================================================================================================")
    console.log("OX_API_KEY:                  " + OX_API_KEY)
    console.log("Executing API Price Request: " + apiQuery)
    console.log("====================================================================================================")
  
    const response = await fetch(
      apiQuery,
      {
        headers: {
          "0x-api-key": OX_API_KEY, // process.env.NEXT_PUBLIC_0X_API_KEY,
        },
      }
    );
  
    const data = await response.json();
    // console.log("Executed Price Response : " + JSON.stringify(data,null,2))
  
    return new Response(JSON.stringify(data, null, 2))
  }

  export { 
    getURLParams,
    apiResponse
  }