// File: lib/hooks/inputValidations/validations/resolveTokenContract.ts

import type { Address, PublicClient } from 'viem';
import { isAddress } from 'viem';
import { fetchTokenMetadata } from '../helpers/fetchTokenMetadata';
// 🚫 removed: import { fetchTokenBalance } from '../helpers/fetchTokenBalance';
import type { TokenContract } from '@/lib/structure';
import { FEED_TYPE, NATIVE_TOKEN_ADDRESS } from '@/lib/structure';
import {
  getLogoURL,
  getTokenLogoURL,
  defaultMissingImage,
} from '@/lib/context/helpers/assetHelpers';
import { getNativeTokenInfo } from '@/lib/network/utils/getNativeTokenInfo';

const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_RESOLVE_TOKEN_CONTRACT === 'true';
function dbg(...args: any[]) {
  if (DEBUG_ENABLED) console.log('[resolveTokenContract]', ...args);
}

export async function resolveTokenContract(
  tokenAddress: string,
  chainId: number,
  feedType: FEED_TYPE,
  publicClient: PublicClient,
  _accountAddress?: Address, // kept for compatibility; unused
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

  // Keep native sentinel verbatim; otherwise use the provided address AS-IS for
  // on-chain use. Filesystem/case handling is delegated to asset helper
  // functions like getTokenLogoURL / getAssetLogoURL.
  const resolvedAddress =
    tokenAddress === NATIVE_TOKEN_ADDRESS
      ? tokenAddress
      : (tokenAddress as `0x${string}`);

  const isNative = resolvedAddress === NATIVE_TOKEN_ADDRESS;
  dbg('normalized (no case changes for on-chain use)', {
    resolvedAddress,
    isNative,
  });

  // For visibility, log the exact filesystem path our helpers will expect for
  // TOKEN_LIST logos. This uses the centralized token-logo helper so that
  // 0x/0X case and hex casing stay consistent with assetHelpers.
  if (feedType === FEED_TYPE.TOKEN_LIST && !isNative) {
    const expectedPath = getTokenLogoURL({
      address: resolvedAddress,
      chainId,
    });
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
      balance: 0n,
      logoURL: logoURL || defaultMissingImage,
    };

    dbg('return native (no balance)', {
      ms: Date.now() - t0,
      ret: {
        ...ret,
        totalSupply: ret.totalSupply?.toString?.() ?? ret.totalSupply,
      },
    });

    return ret;
  }

  // 🧱 ERC-20: metadata + logo in parallel (no balance)
  const [metadata, logoURL] = await Promise.all<[
    ReturnType<typeof fetchTokenMetadata> | undefined,
    string,
  ]>([
    fetchTokenMetadata(resolvedAddress, publicClient)
      .then((m) => {
        dbg('metadata resolved', m);
        return m;
      })
      .catch((e) => {
        dbg('⚠️ metadata get failed', e);
        return undefined;
      }),
    logoP,
  ] as any);

  if (!metadata) {
    dbg('⛔ no metadata; returning undefined', {
      ms: Date.now() - t0,
      resolvedAddress,
    });
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

  dbg('return erc20 (no balance)', {
    ms: Date.now() - t0,
    ret: {
      ...ret,
      totalSupply: ret.totalSupply?.toString?.() ?? ret.totalSupply,
    },
  });

  return ret;
}
