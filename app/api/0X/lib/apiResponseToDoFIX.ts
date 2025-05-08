import { getURLParams } from '@/lib/getURLParams';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// 🌐 Debug logger controlled by .env.local
const debugLog = createDebugLogger(
  'api/0x/server',
  process.env['DEBUG_LOG_API_0X_SERVER_RESPONSE'] === 'true'
);

// ✅ Helper to safely access env vars
const getEnv = (key: string, fallback: string = ''): string => {
  const val = process.env[key];
  return typeof val === 'string' ? val : fallback;
};

// ✅ Read env variables safely using helper
const OX_API_KEY = getEnv('0X_API_KEY', '0');
const FEE_RECIPIENT = getEnv('0X_FEE_RECIPIENT');
const AFFILIATE_FEE = getEnv('0X_AFFILIATE_FEE_BPS', '0');

const FEE_WALLET_DETAILS = `feeRecipient=${FEE_RECIPIENT}&AFFILIATE_FEE=${AFFILIATE_FEE}`;

const apiResponse = async (request: string, urlParms: string) => {
  const apiQuery = `https://${request}?${getURLParams(urlParms)}&${FEE_WALLET_DETAILS}`;

  debugLog.log('====================================================================================================');
  debugLog.log('OX_API_KEY:', OX_API_KEY);
  debugLog.log('Executing 0X API Request:', apiQuery);
  debugLog.log('====================================================================================================');

  const response = await fetch(apiQuery, {
    headers: {
      '0x-api-key': OX_API_KEY,
      '0x-version': 'v2',
    },
  });

  const data = await response.json();
  debugLog.log('API Response:', data);

  return new Response(JSON.stringify(data, null, 2));
};

export { apiResponse };
