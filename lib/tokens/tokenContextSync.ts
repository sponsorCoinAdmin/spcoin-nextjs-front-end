import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

import type { ExchangeContext as ExchangeContextTypeOnly, TokenContract } from '@/lib/structure';
import { getTokenRegistryRecord, tokenRegistry } from '@/lib/context/tokens/tokenRegistry';
import { normalizeTokenCompositeKey } from '@/lib/tokens/tokenKey';

export function patchTradeTokensFromRegistry(
  ctx: ExchangeContextTypeOnly,
): boolean {
  const tradeData = ctx.tradeData;
  let changed = false;

  const patchOne = (
    token: TokenContract | undefined,
  ): TokenContract | undefined => {
    if (!token?.address || !token?.chainId) return token;

    const registryRecord = getTokenRegistryRecord(
      tokenRegistry,
      token.chainId,
      token.address,
    );
    if (!registryRecord) return token;

    const merged: TokenContract = {
      ...registryRecord,
      balance:
        typeof token.balance === 'bigint'
          ? token.balance
          : (registryRecord.balance ?? 0n),
      amount:
        typeof token.amount === 'bigint'
          ? token.amount
          : registryRecord.amount,
    };

    if (
      normalizeTokenCompositeKey(token.chainId, token.address) !==
      normalizeTokenCompositeKey(merged.chainId, merged.address)
    ) {
      return token;
    }

    if (stringifyBigInt(token) === stringifyBigInt(merged)) return token;
    changed = true;
    return merged;
  };

  ctx.tradeData = {
    ...tradeData,
    sellTokenContract: patchOne(tradeData.sellTokenContract),
    buyTokenContract: patchOne(tradeData.buyTokenContract),
    previewTokenContract: patchOne(tradeData.previewTokenContract),
  };

  return changed;
}
