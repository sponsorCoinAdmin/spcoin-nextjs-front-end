// File: @/app/(menu)/Test/Tabs/ExchangeContext/state/enumRegistry.ts
import { FEED_TYPE, TRADE_DIRECTION } from '@/lib/structure';

export const enumRegistry: Record<string, Record<number, string>> = {
  feedType: FEED_TYPE as unknown as Record<number, string>,
  tradeDirection: TRADE_DIRECTION as unknown as Record<number, string>,
};
