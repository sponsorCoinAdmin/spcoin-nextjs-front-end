import { useExchangeContext } from '@/lib/context/hooks';
import type { TRADE_DIRECTION } from '@/lib/structure';

export const useTradeDirection = (): [TRADE_DIRECTION | undefined, (v: TRADE_DIRECTION) => void] => {
  const { exchangeContext, setTradeDirection } = useExchangeContext();
  return [exchangeContext?.tradeData?.tradeDirection, setTradeDirection];
};

export const useSlippage = (): [number, (bps: number) => void] => {
  const { exchangeContext, setSlippageBps } = useExchangeContext();
  const bps = exchangeContext?.tradeData?.slippage?.bps ?? 0;
  return [bps, setSlippageBps];
};
