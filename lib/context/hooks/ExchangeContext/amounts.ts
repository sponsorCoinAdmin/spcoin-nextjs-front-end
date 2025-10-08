import { useExchangeContext } from '@/lib/context/hooks';

export const useSellAmount = (): [bigint, (amt: bigint) => void] => {
  const { exchangeContext, setSellAmount } = useExchangeContext();
  const amt = exchangeContext?.tradeData?.sellTokenContract?.amount ?? 0n;
  return [amt, setSellAmount];
};

export const useBuyAmount = (): [bigint, (amt: bigint) => void] => {
  const { exchangeContext, setBuyAmount } = useExchangeContext();
  const amt = exchangeContext?.tradeData?.buyTokenContract?.amount ?? 0n;
  return [amt, setBuyAmount];
};
