// File: @/lib/hooks/inputValidations/validations/resolveTokenContract.ts

import type { Address, PublicClient } from 'viem';
import { isAddress } from 'viem';
import { fetchTokenMetadata } from '../helpers/fetchTokenMetadata';
// 🚫 removed: import { fetchTokenBalance } from '../helpers/fetchTokenBalance';
import type { TokenContract } from '@/lib/structure';
import { FEED_TYPE, NATIVE_TOKEN_ADDRESS } from '@/lib/structure';
import { loadTokenRecord } from '@/lib/context/tokens/tokenStore';
import { getNativeTokenInfo } from '@/lib/network/utils/getNativeTokenInfo';
import {
  defaultMissingImage,
  getLogoURL,
  getTokenLogoURL,
} from '@/lib/context/helpers/assetHelpers';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_FSM === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_FSM_RESOLVE_TOKEN_CONTRACT === 'true';

const debugLog = createDebugLogger(
  'resolveTokenContract',
  DEBUG_ENABLED,
  LOG_TIME,
);

export async function resolveTokenContract(
  tokenAddress: string,
  chainId: number,
  feedType: FEED_TYPE,
  publicClient: PublicClient,
  _accountAddress?: Address, // kept for compatibility; unused
): Promise<TokenContract | undefined> {
  const t0 = Date.now();

  debugLog.log?.('🟢 [ENTRY] resolveTokenContract', {
    tokenAddress,
    chainId,
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    hasPublicClient: !!publicClient,
    accountAddress: _accountAddress,
  });

  const normalizedForValidation =
    tokenAddress === NATIVE_TOKEN_ADDRESS || !/^0x/i.test(tokenAddress)
      ? tokenAddress
      : `0x${tokenAddress.slice(2).toLowerCase()}`;

  // Allow native sentinel; otherwise require a valid EVM address
  if (tokenAddress !== NATIVE_TOKEN_ADDRESS && !isAddress(normalizedForValidation)) {
    debugLog.warn?.(
      '⛔ Invalid address (not native sentinel and not isAddress)',
      { tokenAddress },
    );
    return undefined;
  }

  // Keep native sentinel verbatim; otherwise use canonical lowercase for EVM reads/lookups.
  const resolvedAddress =
    tokenAddress === NATIVE_TOKEN_ADDRESS
      ? tokenAddress
      : (`0x${tokenAddress.slice(2).toLowerCase()}` as `0x${string}`);

  const isNative = resolvedAddress === NATIVE_TOKEN_ADDRESS;

  debugLog.log?.('ℹ️ Address normalization (canonical lowercase)', {
    resolvedAddress,
    isNative,
  });

  // For visibility, show the exact file path we expect for TOKEN_LIST
  if (feedType === FEED_TYPE.TOKEN_LIST && !isNative) {
    const expectedPath = getTokenLogoURL({
      chainId,
      address: resolvedAddress,
    });
    debugLog.log?.('📁 Expected token logo path (TOKEN_LIST)', {
      chainId,
      address: resolvedAddress,
      expectedPath,
    });
  }

  // Prepare async tasks (run in parallel) — logo only
  const logoP = getLogoURL(chainId, resolvedAddress, feedType)
    .then((url) => {
      debugLog.log?.('🖼️ Logo resolved', {
        chainId,
        address: resolvedAddress,
        url,
      });
      return url;
    })
    .catch((e) => {
      debugLog.warn?.(
        '⚠️ Logo resolution failed, using defaultMissingImage',
        {
          chainId,
          address: resolvedAddress,
          error: e instanceof Error ? e.message : String(e),
        },
      );
      return defaultMissingImage;
    });

  // 🟢 Native: metadata from getNativeTokenInfo, no balance
  if (isNative) {
    debugLog.log?.('🟡 Native token branch', {
      chainId,
      resolvedAddress,
    });

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

    debugLog.log?.('✅ Returning native token (no balance)', {
      ms: Date.now() - t0,
      summary: {
        chainId: ret.chainId,
        address: ret.address,
        symbol: ret.symbol,
        name: ret.name,
        decimals: ret.decimals,
        logoURL: ret.logoURL,
        totalSupply:
          ret.totalSupply && typeof ret.totalSupply === 'bigint'
            ? ret.totalSupply.toString()
            : ret.totalSupply,
      },
    });

    return ret;
  }

  // 🧱 ERC-20: metadata + logo in parallel (no balance)
  debugLog.log?.('🟣 ERC-20 branch (metadata + logo)', {
    chainId,
    resolvedAddress,
  });

  try {
    const stored = await loadTokenRecord(chainId, resolvedAddress);
    return {
      chainId,
      address: resolvedAddress,
      symbol: stored.symbol,
      name: stored.name,
      decimals: stored.decimals,
      totalSupply: stored.totalSupply,
      amount: 0n,
      balance: 0n,
      logoURL: stored.logoURL || defaultMissingImage,
    } as TokenContract;
  } catch {
    // fall through to on-chain metadata when no persisted token asset exists
  }

  const [metadata, logoURL] = await Promise.all([
    fetchTokenMetadata(resolvedAddress, publicClient)
      .then((m) => {
        debugLog.log?.('📦 Metadata resolved', {
          address: resolvedAddress,
          chainId,
          hasMetadata: !!m,
          symbol: m?.symbol,
          name: m?.name,
          decimals: m?.decimals,
        });
        return m;
      })
      .catch((e) => {
        debugLog.warn?.('⚠️ Metadata fetch failed', {
          address: resolvedAddress,
          chainId,
          error: e instanceof Error ? e.message : String(e),
        });
        return undefined;
      }),
    logoP,
  ]);

  if (!metadata) {
    debugLog.warn?.('⛔ No metadata; returning undefined', {
      ms: Date.now() - t0,
      resolvedAddress,
      chainId,
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
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

  debugLog.log?.('✅ Returning ERC-20 token (no balance)', {
    ms: Date.now() - t0,
    summary: {
      chainId: ret.chainId,
      address: ret.address,
      symbol: ret.symbol,
      name: ret.name,
      decimals: ret.decimals,
      logoURL: ret.logoURL,
      totalSupply:
        ret.totalSupply && typeof ret.totalSupply === 'bigint'
          ? ret.totalSupply.toString()
          : ret.totalSupply,
    },
  });

  return ret;
}
