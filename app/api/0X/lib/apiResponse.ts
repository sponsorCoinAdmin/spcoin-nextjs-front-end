import { getURLParams } from '@/lib/getURLParams'
import { createDebugLogger } from '@/lib/utils/debugLogger'
const OX_API_KEY:string = process.env.OX_API_KEY === undefined ? "0" : process.env.OX_API_KEY
const FEE_RECIPIENT = process.env.FEE_RECIPIENT_WALLET
const AFFILIATE_FEE = process.env.AFFILIATE_FEE
const FEE_WALLET_DETAILS = `feeRecipient=${FEE_RECIPIENT}&AFFILIATE_FEE=${AFFILIATE_FEE}`

// 🌐 Debug logging flag and logger controlled by .env.local
const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.DEBUG_LOG_API_0X_SERVER_RESPONSE === 'true';
const debugLog = createDebugLogger('apiResponse', DEBUG_ENABLED, LOG_TIME);

const apiResponse = async(request:string, urlParms:string) => {
    const apiQuery = `https://${request}?${getURLParams(urlParms)}&${FEE_WALLET_DETAILS}`
    debugLog.log("====================================================================================================")
    debugLog.log("OX_API_KEY:               " + OX_API_KEY)
    debugLog.log("Executing 0X API Request: " + apiQuery)
    debugLog.log("====================================================================================================")

    const response = await fetch(
      apiQuery,
      {
        headers: {
          "0x-api-key": OX_API_KEY, // process.env.NEXT_PUBLIC_0X_API_KEY,
          "0x-version": 'v2'
        },
      }
    );
    const data = await response.json();
    debugLog.log(`API Response: {JSON.stringify(data,null,2)}`);
    return new Response(JSON.stringify(data, null, 2))
  }

  export { 
    apiResponse
  }