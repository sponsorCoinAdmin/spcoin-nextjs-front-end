// app/(menu)/Exchange/Test/Tabs/utils.ts
import {
  SP_COIN_DISPLAY,
  TRADE_DIRECTION,
  API_TRADING_PROVIDER,
  ExchangeContext,
} from '@/lib/structure';

function createEnumStringMap<T extends Record<string, string | number>>(
  enumObj: T,
  enumName: string
): Record<number, string> {
  const map: Record<number, string> = {};
  for (const [key, value] of Object.entries(enumObj)) {
    if (typeof value === 'number') map[value] = `${enumName}.${key}`;
  }
  return map;
}

export function normalizeContextDisplay(ctx: ExchangeContext): any {
  const spCoinDisplayMap = createEnumStringMap(SP_COIN_DISPLAY, 'SP_COIN_DISPLAY');
  const tradeDirectionMap = createEnumStringMap(TRADE_DIRECTION, 'TRADE_DIRECTION');
  const apiProviderMap = createEnumStringMap(API_TRADING_PROVIDER, 'API_TRADING_PROVIDER');

  const settings = ctx.settings ?? {};
  const tradeData = ctx.tradeData ?? {};
  const active: any = settings.activeDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF;

  return {
    ...ctx,
    settings: {
      ...settings,
      activeDisplay: spCoinDisplayMap[active],
      apiTradingProvider: apiProviderMap[settings.apiTradingProvider ?? API_TRADING_PROVIDER.API_0X],
    },
    tradeData: {
      ...tradeData,
      tradeDirection: tradeDirectionMap[tradeData.tradeDirection ?? TRADE_DIRECTION.SELL_EXACT_OUT],
    },
  };
}
