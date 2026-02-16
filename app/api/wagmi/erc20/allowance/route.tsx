// File: app/api/wagmi/erc20/allowance/route.tsx
'use server';

import { badRequest, getOptionalChainId, getRequiredAddress, ok, readErc20 } from '../_shared';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tokenAddress = getRequiredAddress(url, ['tokenAddress', 'token', 'address']);
    const ownerAddress = getRequiredAddress(url, ['ownerAddress', 'owner']);
    const spenderAddress = getRequiredAddress(url, ['spenderAddress', 'spender']);
    const chainId = getOptionalChainId(url);

    const value = (await readErc20(
      'allowance',
      tokenAddress,
      [ownerAddress, spenderAddress],
      chainId,
    )) as bigint;

    return ok({
      tokenAddress,
      ownerAddress,
      spenderAddress,
      chainId: chainId ?? null,
      value,
    });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid request');
  }
}
