import type { ExchangeContext, TradeData, TokenContract } from '@/lib/structure';

import { toPersistedTokenRef } from '@/lib/tokens/tokenKey';

export function stripPersistedTradeTokens(tradeData: unknown): TradeData | unknown {
  if (!tradeData || typeof tradeData !== 'object') return tradeData;

  const src = tradeData as {
    sellTokenContract?: unknown;
    buyTokenContract?: unknown;
    previewTokenContract?: unknown;
  };
  return {
    ...src,
    sellTokenContract: toPersistedTokenRef(src.sellTokenContract),
    buyTokenContract: toPersistedTokenRef(src.buyTokenContract),
    previewTokenContract: toPersistedTokenRef(src.previewTokenContract),
  } as TradeData;
}

export function stripPersistedTokenData(ctx: ExchangeContext): ExchangeContext {
  return {
    ...ctx,
    tradeData: stripPersistedTradeTokens(ctx.tradeData) as TradeData,
  } as ExchangeContext;
}

export function toSanitizedTokenRef(
  token: unknown,
): TokenContract | undefined {
  return toPersistedTokenRef(token);
}
