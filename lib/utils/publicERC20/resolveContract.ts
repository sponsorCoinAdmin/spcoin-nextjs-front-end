// File: lib/utils/publicERC20/resolveContract.ts

import { Address, isAddress } from 'viem';
import { TokenContract } from '@/lib/structure/types';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const erc20Abi = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
];

export async function resolveContract(
  tokenAddress: Address,
  chainId: number,
  publicClient: ReturnType<typeof createPublicClient>,
  accountAddress?: Address
): Promise<TokenContract | undefined> {
  if (!tokenAddress || !isAddress(tokenAddress)) return undefined;

  try {
    const results = await publicClient.multicall({
      contracts: [
        { address: tokenAddress, abi: erc20Abi, functionName: 'name' },
        { address: tokenAddress, abi: erc20Abi, functionName: 'symbol' },
        { address: tokenAddress, abi: erc20Abi, functionName: 'decimals' },
        { address: tokenAddress, abi: erc20Abi, functionName: 'totalSupply' },
      ],
    });

    const [nameRes, symbolRes, decimalsRes, totalSupplyRes] = results;

    const name = nameRes.status === 'success' && typeof nameRes.result === 'string' ? nameRes.result : 'Missing name';
    const symbol = symbolRes.status === 'success' && typeof symbolRes.result === 'string' ? symbolRes.result : 'Missing symbol';
    const decimals = decimalsRes.status === 'success' && typeof decimalsRes.result === 'number' ? decimalsRes.result : 18;
    const totalSupply = totalSupplyRes.status === 'success' && typeof totalSupplyRes.result === 'bigint' ? totalSupplyRes.result : 0n;

    let balance: bigint = 0n;
    if (accountAddress) {
      try {
        const balanceResult = await publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [accountAddress],
        });
        if (typeof balanceResult === 'bigint') {
          balance = balanceResult;
        }
      } catch (err) {
        // Balance is optional, fail silently
      }
    }

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      totalSupply,
      balance,
      chainId,
    };
  } catch (err) {
    console.error('❌ Failed to resolve token contract:', err);
    return undefined;
  }
}
