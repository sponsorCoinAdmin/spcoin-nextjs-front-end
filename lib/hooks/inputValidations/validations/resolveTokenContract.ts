// File: lib/hooks/inputValidations/validations/resolveTokenContract.ts

import { isAddress, Address, getAddress, PublicClient } from 'viem';
import { fetchTokenMetadata } from '../helpers/fetchTokenMetadata';
import { fetchTokenBalance } from '../helpers/fetchTokenBalance';
import { TokenContract, FEED_TYPE } from '@/lib/structure';
import { getLogoURL, NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils';
import { getNativeTokenInfo } from '@/lib/network/utils/getNativeTokenInfo';

export async function resolveTokenContract(
  tokenAddress: string,
  chainId: number,
  feedType: FEED_TYPE,
  publicClient: PublicClient,
  accountAddress?: Address
): Promise<TokenContract | undefined> {
  if (!isAddress(tokenAddress)) return undefined;

  const isNative = tokenAddress === NATIVE_TOKEN_ADDRESS;
  const resolvedAddress = getAddress(tokenAddress) as `0x${string}`;

  if (!resolvedAddress || !isAddress(resolvedAddress)) return undefined;

  const logoURL = getLogoURL(chainId, resolvedAddress, feedType);

  const balance = accountAddress
    ? await fetchTokenBalance(resolvedAddress, accountAddress, isNative, publicClient)
    : 0n;

  if (isNative) {
    const nativeInfo = getNativeTokenInfo(chainId);
    return {
      chainId,
      address: resolvedAddress,
      symbol: nativeInfo.symbol,
      name: nativeInfo.name,
      decimals: nativeInfo.decimals,
      totalSupply: nativeInfo.totalSupply,
      amount: 0n,
      balance,
      logoURL,
    };
  }

  const metadata = await fetchTokenMetadata(resolvedAddress, publicClient);
  if (!metadata) return undefined;

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
