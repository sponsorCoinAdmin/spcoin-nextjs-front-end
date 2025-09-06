// File: lib/hooks/inputValidations/validations/resolveTokenContract.ts

import { isAddress, Address, PublicClient } from 'viem';
import { fetchTokenMetadata } from '../helpers/fetchTokenMetadata';
// 🚫 removed: import { fetchTokenBalance } from '../helpers/fetchTokenBalance';
import { TokenContract, FEED_TYPE, NATIVE_TOKEN_ADDRESS } from '@/lib/structure';
import { getLogoURL, defaultMissingImage } from '@/lib/network/utils';
import { getNativeTokenInfo } from '@/lib/network/utils/getNativeTokenInfo';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RESOLVE_TOKEN_CONTRACT === 'true';
function dbg(...args: any[]) {
  if (DEBUG_ENABLED) console.log('[resolveTokenContract]', ...args);
}

/**
 * Resolves a TokenContract from an address:
 * - Keeps address case AS-IS (no checksum/case normalization)
 * - Fetches logo URL and metadata in parallel
 * - ❌ Does NOT fetch user balance (authoritative source is useGetBalance hook)
 * - Always returns a TokenContract with a logoURL (fallbacks to defaultMissingImage)
 */
export async function resolveTokenContract(
  tokenAddress: string,
  chainId: number,
  feedType: FEED_TYPE,
  publicClient: PublicClient,
  _accountAddress?: Address // kept for compatibility; unused
): Promise<TokenContract | undefined> {
  const t0 = Date.now();
  dbg('entry', {
    tokenAddress,
    chainId,
    feedType,
    hasPublicClient: !!publicClient,
    accountAddress: _accountAddress,
  });

  // Allow native sentinel; otherwise require a valid EVM address
  if (tokenAddress !== NATIVE_TOKEN_ADDRESS && !isAddress(tokenAddress)) {
    dbg('⛔ invalid address (not native sentinel and not isAddress):', tokenAddress);
    return undefined;
  }

  // Keep native sentinel verbatim; otherwise use the provided address AS-IS (no case normalization)
  const resolvedAddress =
    tokenAddress === NATIVE_TOKEN_ADDRESS ? tokenAddress : (tokenAddress as `0x${string}`);

  const isNative = resolvedAddress === NATIVE_TOKEN_ADDRESS;
  dbg('normalized (no case changes)', { resolvedAddress, isNative });

  // For visibility, show the exact file path we expect for TOKEN_LIST
  if (feedType === FEED_TYPE.TOKEN_LIST && !isNative) {
    const expectedPath = `/assets/blockchains/${chainId}/contracts/${resolvedAddress}/logo.png`;
    dbg('expected token logo path', expectedPath);
  }

  // Prepare async tasks (run in parallel) — logo only
  const logoP = getLogoURL(chainId, resolvedAddress, feedType)
    .then((url) => {
      dbg('logo resolved', { url });
      return url;
    })
    .catch((e) => {
      dbg('⚠️ logo resolution failed, using defaultMissingImage', e);
      return defaultMissingImage;
    });

  // 🟢 Native: metadata from getNativeTokenInfo, no balance
  if (isNative) {
    const [logoURL] = await Promise.all([logoP]);
    const nativeInfo = getNativeTokenInfo(chainId);

    const ret: TokenContract = {
      chainId,
      address: resolvedAddress,
      symbol: nativeInfo.symbol,
      name: nativeInfo.name,
      decimals: nativeInfo.decimals,
      totalSupply: nativeInfo.totalSupply,
      amount: 0n,
      balance: 0n, // ⬅️ balance omitted here; fetched via useGetBalance in UI
      logoURL: logoURL || defaultMissingImage,
    };

    dbg('return native (no balance fetch)', {
      ms: Date.now() - t0,
      ret: {
        ...ret,
        totalSupply: ret.totalSupply?.toString?.() ?? ret.totalSupply,
      },
    });

    return ret;
  }

  // 🧱 ERC-20: metadata + logo in parallel (no balance)
  const [metadata, logoURL] = await Promise.all([
    fetchTokenMetadata(resolvedAddress, publicClient)
      .then((m) => {
        dbg('metadata resolved', m);
        return m;
      })
      .catch((e) => {
        dbg('⚠️ metadata fetch failed', e);
        return undefined;
      }),
    logoP,
  ]);

  if (!metadata) {
    dbg('⛔ no metadata; returning undefined', { ms: Date.now() - t0, resolvedAddress });
    return undefined;
  }

  const ret: TokenContract = {
    chainId,
    address: resolvedAddress,
    symbol: metadata.symbol,
    name: metadata.name,
    decimals: metadata.decimals,
    totalSupply: metadata.totalSupply,
    amount: 0n,
    balance: 0n, // ⬅️ UI will show live value from the TanStack cache
    logoURL: logoURL || defaultMissingImage,
  };

  dbg('return erc20 (no balance fetch)', {
    ms: Date.now() - t0,
    ret: {
      ...ret,
      totalSupply: ret.totalSupply?.toString?.() ?? ret.totalSupply,
    },
  });

  return ret;
}
