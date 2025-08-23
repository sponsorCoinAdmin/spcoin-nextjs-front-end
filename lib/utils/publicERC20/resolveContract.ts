// File: lib/utils/publicERC20/resolveContract.ts
import { Address, isAddress } from 'viem';
import { TokenContract } from '@/lib/structure/types';
import { createPublicClient } from 'viem';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RESOLVE_CONTRACT === 'true';
const debug = createDebugLogger('resolveContract', LOG_ENABLED);

const erc20Abi = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
];

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

function isNativeSentinel(addr: string): boolean {
  const a = addr.toLowerCase();
  const n = String(NATIVE_TOKEN_ADDRESS).toLowerCase();
  return a === n || a === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
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
  accountAddress?: Address
): Promise<TokenContract | undefined> {
  if (!tokenAddress) return undefined;

  const addrStr = String(tokenAddress);
  debug.log('↪️ enter', { tokenAddress: addrStr, nativeConst: String(NATIVE_TOKEN_ADDRESS), chainId });

  if (!isAddress(tokenAddress)) {
    debug.warn('⚠️ not a checksummed EVM address, aborting');
    return undefined;
  }

  // Native path
  if (isNativeSentinel(addrStr)) {
    debug.log('🟢 detected native sentinel, taking native path');

    const meta = await fetchNativeTokenMeta(chainId);
    const name = meta?.name ?? 'Native Token';
    const symbol = meta?.symbol ?? 'NATIVE';
    const decimals = meta?.decimals ?? 18;

    let balance: bigint = 0n;
    if (accountAddress) {
      try {
        balance = await publicClient.getBalance({ address: accountAddress });
        debug.log('💰 native balance', { accountAddress, balance: balance.toString() });
      } catch (err: any) {
        debug.warn('⚠️ getBalance failed (ignored):', err?.message ?? err);
      }
    }

    const nativeToken: TokenContract = {
      address: NATIVE_TOKEN_ADDRESS as Address,
      name,
      symbol,
      decimals,
      totalSupply: 0n,
      balance,
      chainId,
    };
    debug.log('✅ native token resolved', nativeToken);
    return nativeToken;
  }

  // ERC-20 path
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

    let balance: bigint = 0n;
    if (accountAddress) {
      try {
        const balanceResult = await publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [accountAddress],
        });
        if (typeof balanceResult === 'bigint') balance = balanceResult;
        debug.log('💰 erc20 balance', { accountAddress, balance: balance.toString() });
      } catch (err: any) {
        debug.warn('⚠️ balanceOf failed (ignored):', err?.message ?? err);
      }
    }

    const token: TokenContract = {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      totalSupply,
      balance,
      chainId,
    };
    debug.log('✅ erc20 token resolved', token);
    return token;
  } catch (err: any) {
    debug.error('❌ ERC-20 resolve failed:', err?.message ?? err);
    return undefined;
  }
}
