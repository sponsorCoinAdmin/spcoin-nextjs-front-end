// File: lib/utils/publicERC20/resolveContract.ts
import type { Address} from 'viem';
import { isAddress } from 'viem';
import type { TokenContract } from '@/lib/structure/types';
import type { createPublicClient } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/structure';

const LOG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RESOLVE_CONTRACT === 'true';
const debug = createDebugLogger('resolveContract', LOG_ENABLED);

// ERC-20 metadata-only ABI (no balanceOf here)
const erc20Abi = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;

// Minimal mapping so native tokens don’t show “NATIVE”
const nativeSymbolByChain: Record<number, { name: string; symbol: string; decimals: number }> = {
  1: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  10: { name: 'Ether', symbol: 'ETH', decimals: 18 },      // Optimism
  56: { name: 'BNB', symbol: 'BNB', decimals: 18 },        // BSC
  137: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },   // Polygon
  8453: { name: 'Ether', symbol: 'ETH', decimals: 18 },    // Base
  42161: { name: 'Ether', symbol: 'ETH', decimals: 18 },   // Arbitrum
  43114: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },   // Avalanche
  250: { name: 'Fantom', symbol: 'FTM', decimals: 18 },    // Fantom
};

// Use ONLY the imported canonical sentinel; detect natively by case-insensitive compare
function isNativeSentinel(addr: string): boolean {
  return addr.toLowerCase() === String(NATIVE_TOKEN_ADDRESS).toLowerCase();
}

async function fetchNativeTokenMeta(chainId: number): Promise<{ name: string; symbol: string; decimals: number } | undefined> {
  try {
    const url = `/api/native-token/${chainId}`;
    debug.log(`🌐 fetch native meta → ${url}`);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      debug.warn(`⚠️ native meta fetch not ok: ${res.status} ${res.statusText}`);
      return nativeSymbolByChain[chainId];
    }
    const data = await res.json();
    debug.log('📦 native meta payload:', data);
    const fromApi = {
      name: typeof data?.name === 'string' ? data.name : undefined,
      symbol: typeof data?.symbol === 'string' ? data.symbol : undefined,
      decimals: Number.isFinite(data?.decimals) ? Number(data.decimals) : undefined,
    };
    return {
      name: fromApi.name ?? nativeSymbolByChain[chainId]?.name ?? 'Native Token',
      symbol: fromApi.symbol ?? nativeSymbolByChain[chainId]?.symbol ?? 'NATIVE',
      decimals: fromApi.decimals ?? nativeSymbolByChain[chainId]?.decimals ?? 18,
    };
  } catch (err: any) {
    debug.error('❌ native meta fetch failed:', err?.message ?? err);
    return nativeSymbolByChain[chainId] ?? { name: 'Native Token', symbol: 'NATIVE', decimals: 18 };
  }
}

export async function resolveContract(
  tokenAddress: Address,
  chainId: number,
  publicClient: ReturnType<typeof createPublicClient>,
  _accountAddress?: Address // kept for compatibility; unused
): Promise<TokenContract | undefined> {
  if (!tokenAddress) return undefined;

  const addrStr = String(tokenAddress);
  debug.log('↪️ enter', { tokenAddress: addrStr, nativeConst: String(NATIVE_TOKEN_ADDRESS), chainId });

  if (!isAddress(tokenAddress)) {
    debug.warn('⚠️ not a checksummed EVM address, aborting');
    return undefined;
  }

  // Native path (metadata only)
  if (isNativeSentinel(addrStr)) {
    debug.log('🟢 detected native sentinel, taking native path');

    const meta = await fetchNativeTokenMeta(chainId);
    const name = meta?.name ?? 'Native Token';
    const symbol = meta?.symbol ?? 'NATIVE';
    const decimals = meta?.decimals ?? 18;

    const nativeToken: TokenContract = {
      address: NATIVE_TOKEN_ADDRESS as Address,
      name,
      symbol,
      decimals,
      totalSupply: 0n,
      balance: 0n, // live value comes from useGetBalance
      chainId,
    };
    debug.log('✅ native token resolved (no balance)', nativeToken);
    return nativeToken;
  }

  // ERC-20 path (metadata only)
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
    debug.log('🧪 multicall results (statuses)', {
      name: nameRes.status,
      symbol: symbolRes.status,
      decimals: decimalsRes.status,
      totalSupply: totalSupplyRes.status,
    });

    const name = nameRes.status === 'success' && typeof nameRes.result === 'string' ? nameRes.result : 'Missing name';
    const symbol = symbolRes.status === 'success' && typeof symbolRes.result === 'string' ? symbolRes.result : 'Missing symbol';
    const decimals = decimalsRes.status === 'success' && typeof decimalsRes.result === 'number' ? decimalsRes.result : 18;
    const totalSupply = totalSupplyRes.status === 'success' && typeof totalSupplyRes.result === 'bigint' ? totalSupplyRes.result : 0n;

    const token: TokenContract = {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      totalSupply,
      balance: 0n, // live value comes from useGetBalance
      chainId,
    };
    debug.log('✅ erc20 token resolved (no balance)', token);
    return token;
  } catch (err: any) {
    debug.error('❌ ERC-20 resolve failed:', err?.message ?? err);
    return undefined;
  }
}
