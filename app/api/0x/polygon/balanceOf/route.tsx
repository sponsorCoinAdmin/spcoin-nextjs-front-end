// File: app/api/0x/polygon/balanceOf/route.tsx
'use server';

import {
  badRequest,
  getOptionalChainId,
  getRequiredAddress,
  ok,
  readErc20,
} from '@/app/api/wagmi/erc20/_shared';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tokenAddress = getRequiredAddress(url, ['tokenAddress', 'token', 'address']);
    const ownerAddress = getRequiredAddress(url, ['ownerAddress', 'owner', 'accountAddress', 'account']);
    const chainId = getOptionalChainId(url);

    const value = (await readErc20('balanceOf', tokenAddress, [ownerAddress], chainId)) as bigint;
    return ok({
      tokenAddress,
      ownerAddress,
      chainId: chainId ?? null,
      value,
    });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid request');
  }
}
