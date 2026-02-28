import type { ExchangeContext as ExchangeContextTypeOnly, TokenContract } from '@/lib/structure';

import {
  getTokenRegistryRecord,
  syncTokenRegistryPins,
  tokenRegistry,
  type TokenRegistry,
  type TokenRegistryRecord,
  upsertTokenRegistryRecord,
} from '@/lib/context/tokens/tokenRegistry';
import {
  getTokenAddress,
  getTokenChainId,
  normalizeTokenCompositeKey,
} from '@/lib/tokens/tokenKey';

export function normalizeExchangeTokensWithRegistry(
  ctx: ExchangeContextTypeOnly,
  registry: TokenRegistry = tokenRegistry,
): ExchangeContextTypeOnly {
  const next = ctx;
  const tradeData = (next as any).tradeData ?? {};
  (next as any).tradeData = tradeData;

  const syncSingle = (
    field: 'sellTokenContract' | 'buyTokenContract' | 'previewTokenContract',
    pinKey: string,
  ) => {
    const current = tradeData[field] as TokenRegistryRecord | undefined;
    const chainId = Number(current?.chainId ?? 0);
    const address =
      typeof current?.address === 'string' ? current.address.trim() : '';

    syncTokenRegistryPins(
      registry,
      pinKey,
      chainId > 0 && address ? [{ chainId, address }] : [],
    );

    if (!(chainId > 0) || !address) {
      tradeData[field] = current;
      return;
    }

    tradeData[field] = current
      ? upsertTokenRegistryRecord(registry, current, pinKey)
      : getTokenRegistryRecord<TokenRegistryRecord>(registry, chainId, address, pinKey);
  };

  syncSingle('sellTokenContract', 'trade:sell');
  syncSingle('buyTokenContract', 'trade:buy');
  syncSingle('previewTokenContract', 'trade:preview');

  return next;
}

export function rehydrateTradeTokenRefs(
  tradeData: ExchangeContextTypeOnly['tradeData'],
  hydratedByKey: Map<string, TokenContract>,
): ExchangeContextTypeOnly['tradeData'] {
  const mapOne = (token: unknown) => {
    const chainId = getTokenChainId(token);
    const address = getTokenAddress(token);
    if (!chainId || !address) return undefined;
    return hydratedByKey.get(normalizeTokenCompositeKey(chainId, address));
  };

  return {
    ...tradeData,
    sellTokenContract: mapOne(tradeData.sellTokenContract),
    buyTokenContract: mapOne(tradeData.buyTokenContract),
    previewTokenContract: mapOne(tradeData.previewTokenContract),
  };
}
