// File: lib/hooks/inputValidations/validations/resolveTokenContract.ts

import { isAddress, Address, getAddress, PublicClient } from 'viem';
import { fetchTokenMetadata } from '../helpers/fetchTokenMetadata';
import { fetchTokenBalance } from '../helpers/fetchTokenBalance';
import { TokenContract, FEED_TYPE } from '@/lib/structure';
import { getNativeWrapAddress, getLogoURL, NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils';

export async function resolveTokenContract(
  tokenAddress: string,
  chainId: number,
  feedType: FEED_TYPE,
  publicClient: PublicClient,
  accountAddress?: Address
): Promise<TokenContract | undefined> {
  if (!isAddress(tokenAddress)) return undefined;

  const isNative = tokenAddress === NATIVE_TOKEN_ADDRESS;

  const rawAddress = isNative
    ? getNativeWrapAddress(chainId)
    : getAddress(tokenAddress);

  if (!rawAddress || !isAddress(rawAddress)) return undefined;

  const resolvedAddress = rawAddress as `0x${string}`;
const metadata = await fetchTokenMetadata(resolvedAddress, publicClient);
  if (!metadata) return undefined;

  const logoURL = getLogoURL(chainId, resolvedAddress, feedType);
  const balance = accountAddress
    ? await fetchTokenBalance(resolvedAddress, accountAddress, isNative, publicClient)
    : 0n;

  return {
    chainId,
    address: resolvedAddress,
    symbol: metadata.symbol,
    name: metadata.name,
    decimals: metadata.decimals,
    totalSupply: metadata.totalSupply,
    amount: 0n,
    balance,
    logoURL,
  };
}
