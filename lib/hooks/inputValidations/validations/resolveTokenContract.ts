// File: lib/hooks/inputValidations/validations/resolveTokenContract.ts

import { isAddress, Address, PublicClient } from 'viem';
import { fetchTokenMetadata } from '../helpers/fetchTokenMetadata';
import { fetchTokenBalance } from '../helpers/fetchTokenBalance';
import { TokenContract, FEED_TYPE } from '@/lib/structure';
import { getLogoURL, NATIVE_TOKEN_ADDRESS, defaultMissingImage } from '@/lib/context/helpers/NetworkHelpers';
import { getNativeTokenInfo } from '@/lib/context/helpers/networkhelpers/getNativeTokenInfo';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_RESOLVE_TOKEN_CONTRACT === 'true';
function dbg(...args: any[]) {
  if (DEBUG_ENABLED) console.log('[resolveTokenContract]', ...args);
}

/**
 * Resolves a TokenContract from an address:
 * - Keeps address case AS-IS (no checksum/case normalization)
 * - Fetches logo URL (async), balance, and metadata in parallel
 * - Always returns a TokenContract with a logoURL (fallbacks to defaultMissingImage)
 */
export async function resolveTokenContract(
  tokenAddress: string,
  chainId: number,
  feedType: FEED_TYPE,
  publicClient: PublicClient,
  accountAddress?: Address
): Promise<TokenContract | undefined> {
  const t0 = Date.now();
  dbg('entry', {
    tokenAddress,
    chainId,
    feedType,
    hasPublicClient: !!publicClient,
    accountAddress,
  });

  // Allow native sentinel; otherwise require a valid EVM address
  if (tokenAddress !== NATIVE_TOKEN_ADDRESS && !isAddress(tokenAddress)) {
    dbg('⛔ invalid address (not native sentinel and not isAddress):', tokenAddress);
    return undefined;
  }

  // Keep native sentinel verbatim; otherwise use the provided address AS-IS (no case normalization)
  const resolvedAddress = (tokenAddress === NATIVE_TOKEN_ADDRESS
    ? tokenAddress
    : (tokenAddress as `0x${string}`));

  const isNative = resolvedAddress === NATIVE_TOKEN_ADDRESS;
  dbg('normalized (no case changes)', { resolvedAddress, isNative });

  // For visibility, show the exact file path we expect for TOKEN_LIST
  if (feedType === FEED_TYPE.TOKEN_LIST && !isNative) {
    const expectedPath = `/assets/blockchains/${chainId}/contracts/${resolvedAddress}/logo.png`;
    dbg('expected token logo path', expectedPath);
  }

  // Prepare async tasks (run in parallel)
  const logoP = getLogoURL(chainId, resolvedAddress, feedType)
    .then((url) => {
      dbg('logo resolved', { url });
      return url;
    })
    .catch((e) => {
      dbg('⚠️ logo resolution failed, using defaultMissingImage', e);
      return defaultMissingImage;
    });

  const balanceP = accountAddress
    ? fetchTokenBalance(resolvedAddress, accountAddress, isNative, publicClient)
        .then((b) => {
          dbg('balance resolved', { b: b?.toString?.() ?? String(b) });
          return b;
        })
        .catch((e) => {
          dbg('⚠️ balance fetch failed, using 0n', e);
          return 0n;
        })
    : Promise.resolve<bigint>(0n);

  if (isNative) {
    const [logoURL, balance] = await Promise.all([logoP, balanceP]);
    const nativeInfo = getNativeTokenInfo(chainId);

    const ret: TokenContract = {
      chainId,
      address: resolvedAddress,
      symbol: nativeInfo.symbol,
      name: nativeInfo.name,
      decimals: nativeInfo.decimals,
      totalSupply: nativeInfo.totalSupply,
      amount: 0n,
      balance,
      logoURL: logoURL || defaultMissingImage,
    };

    dbg('return native', {
      ms: Date.now() - t0,
      ret: {
        ...ret,
        balance: ret.balance.toString(),
        totalSupply: ret.totalSupply?.toString?.() ?? ret.totalSupply,
      },
    });

    return ret;
  }

  // ERC-20: metadata + balance + logo in parallel
  const [metadata, balance, logoURL] = await Promise.all([
    fetchTokenMetadata(resolvedAddress, publicClient)
      .then((m) => {
        dbg('metadata resolved', m);
        return m;
      })
      .catch((e) => {
        dbg('⚠️ metadata fetch failed', e);
        return undefined;
      }),
    balanceP,
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
    balance,
    logoURL: logoURL || defaultMissingImage,
  };

  dbg('return erc20', {
    ms: Date.now() - t0,
    ret: {
      ...ret,
      balance: ret.balance.toString(),
      totalSupply: ret.totalSupply?.toString?.() ?? ret.totalSupply,
    },
  });

  return ret;
}
