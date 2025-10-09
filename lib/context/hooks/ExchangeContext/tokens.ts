import { useExchangeContext } from '@/lib/context/hooks';
import type { TokenContract } from '@/lib/structure';

export const useSellTokenContract = (): [TokenContract | undefined, (c: TokenContract | undefined) => void] => {
  const { exchangeContext, setSellTokenContract } = useExchangeContext();
  return [exchangeContext?.tradeData?.sellTokenContract, setSellTokenContract];
};

export const useBuyTokenContract = (): [TokenContract | undefined, (c: TokenContract | undefined) => void] => {
  const { exchangeContext, setBuyTokenContract } = useExchangeContext();
  return [exchangeContext?.tradeData?.buyTokenContract, setBuyTokenContract];
};
