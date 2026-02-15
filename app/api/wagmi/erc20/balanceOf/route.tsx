// File: app/api/wagmi/erc20/balanceOf/route.tsx
'use server';

import { getURLParams } from '@/lib/getURLParams';
import { getQueryVariable } from '@/lib/spCoin/coreUtils';
import { getWagmiBalanceOfRec } from '@/lib/wagmi/getWagmiBalanceOfRec';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_SERVER_DEBUG_LOG_USE_GET_BALANCE === 'true';
const debugLog = createDebugLogger('getWagmiBalanceOfRecRoute', DEBUG_ENABLED, LOG_TIME);

export async function GET(req: Request) {
  const params = getURLParams(req.url);
  const tokenAddress = getQueryVariable(params, 'tokenAddress');

  const wagmiBalance = await getWagmiBalanceOfRec(tokenAddress);

  debugLog.log?.('[getWagmiBalanceOfRecRoute] BalanceOf result', {
    tokenAddress,
    wagmiBalance,
  });

  return new Response(JSON.stringify(wagmiBalance));
}
