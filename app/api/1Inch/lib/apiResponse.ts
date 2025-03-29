import { getURLParams } from '@/lib/getURLParams';

const FEE_RECIPIENT = process.env.FEE_RECIPIENT_WALLET;
const AFFILIATE_FEE = process.env.AFFILIATE_FEE;

const apiResponse = async (request: string, urlParms: string) => {
  const urlParamsOnly = getURLParams(urlParms);
  const isSwap = request.includes('/swap');

  const fullParams = isSwap
    ? `${urlParamsOnly}&feeRecipient=${FEE_RECIPIENT}&AFFILIATE_FEE=${AFFILIATE_FEE}`
    : urlParamsOnly;

  const apiQuery = `https://${request}?${fullParams}`;

  console.debug(`====================================================================================================`);
  console.debug(`Executing 1Inch API Request: ${apiQuery}`);
  console.debug(`====================================================================================================`);

  try {
    const response = await fetch(apiQuery);
    const data = await response.json();
    console.debug(JSON.stringify(data, null, 2));
    return new Response(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Failed to fetch from 1inch API:`, err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};

export { apiResponse };
