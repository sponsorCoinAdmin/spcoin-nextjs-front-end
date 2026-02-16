// File: app/api/wagmi/erc20/symbol/route.tsx
'use server';

import { badRequest, getOptionalChainId, getRequiredAddress, ok, readErc20 } from '../_shared';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tokenAddress = getRequiredAddress(url, ['tokenAddress', 'token', 'address']);
    const chainId = getOptionalChainId(url);
    const value = (await readErc20('symbol', tokenAddress, [], chainId)) as string;
    return ok({ tokenAddress, chainId: chainId ?? null, value });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid request');
  }
}
