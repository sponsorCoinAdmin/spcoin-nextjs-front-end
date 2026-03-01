// File: @/lib/utils/publicERC20/resolveContract.ts
import { type Address, type PublicClient } from 'viem';
import { isAddress } from '@/lib/utils/address';
import type { TokenContract } from '@/lib/structure/types';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/structure';
import { getNativeTokenMeta } from '@/lib/api';

const LOG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RESOLVE_CONTRACT === 'true';
const debug = createDebugLogger('resolveContract', LOG_ENABLED);

const erc20Abi = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;

const nativeSymbolByChain: Record<number, { name: string; symbol: string; decimals: number }> = {
  1: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  10: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  56: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  137: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  8453: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  42161: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  43114: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
  250: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
};

function isNativeSentinel(addr: string): boolean {
  return addr.toLowerCase() === String(NATIVE_TOKEN_ADDRESS).toLowerCase();
}

async function fetchNativeTokenMetaSafe(
  chainId: number,
): Promise<{ name: string; symbol: string; decimals: number }> {
  const fallback = nativeSymbolByChain[chainId] ?? { name: 'Native Token', symbol: 'NATIVE', decimals: 18 };
  try {
    const data = await getNativeTokenMeta(chainId, { timeoutMs: 6000 });
    return {
      name: typeof data?.name === 'string' ? data.name : fallback.name,
      symbol: typeof data?.symbol === 'string' ? data.symbol : fallback.symbol,
      decimals: Number.isFinite(data?.decimals) ? Number(data.decimals) : fallback.decimals,
    };
  } catch (err: any) {
    debug.error('native meta get failed:', err?.message ?? err);
    return fallback;
  }
}

export async function resolveContract(
  tokenAddress: Address,
  chainId: number,
  publicClient: PublicClient,
  _accountAddress?: Address,
): Promise<TokenContract | undefined> {
  if (!tokenAddress) return undefined;

  const addrStr = String(tokenAddress);
  if (!isAddress(tokenAddress)) {
    debug.warn('not a checksummed EVM address, aborting');
    return undefined;
  }

  if (isNativeSentinel(addrStr)) {
    const meta = await fetchNativeTokenMetaSafe(chainId);
    return {
      address: NATIVE_TOKEN_ADDRESS as Address,
      name: meta.name,
      symbol: meta.symbol,
      decimals: meta.decimals,
      totalSupply: 0n,
      balance: 0n,
      chainId,
    };
  }

  try {
    const results = await publicClient.multicall({
      allowFailure: true,
      contracts: [
        { address: tokenAddress, abi: erc20Abi, functionName: 'name' },
        { address: tokenAddress, abi: erc20Abi, functionName: 'symbol' },
        { address: tokenAddress, abi: erc20Abi, functionName: 'decimals' },
        { address: tokenAddress, abi: erc20Abi, functionName: 'totalSupply' },
      ],
    });

    const [nameRes, symbolRes, decimalsRes, totalSupplyRes] = results;

    const name =
      nameRes.status === 'success' && typeof nameRes.result === 'string' ? nameRes.result : 'Missing name';
    const symbol =
      symbolRes.status === 'success' && typeof symbolRes.result === 'string' ? symbolRes.result : 'Missing symbol';
    const decimals =
      decimalsRes.status === 'success' && typeof decimalsRes.result === 'number' ? decimalsRes.result : 18;
    const totalSupply =
      totalSupplyRes.status === 'success' && typeof totalSupplyRes.result === 'bigint' ? totalSupplyRes.result : 0n;

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      totalSupply,
      balance: 0n,
      chainId,
    };
  } catch (err: any) {
    debug.error('ERC-20 resolve failed:', err?.message ?? err);
    return undefined;
  }
}
