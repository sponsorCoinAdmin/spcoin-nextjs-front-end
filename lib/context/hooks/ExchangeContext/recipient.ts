import { useExchangeContext } from '@/lib/context/hooks';
import type { spCoinAccount } from '@/lib/structure';

export const useRecipientAccount = (): [spCoinAccount | undefined, (w: spCoinAccount | undefined) => void] => {
  const { exchangeContext, setRecipientAccount } = useExchangeContext();
  return [exchangeContext?.accounts?.recipientAccount, setRecipientAccount];
};

export const useActiveAccount = () => {
  const { exchangeContext } = useExchangeContext();
  return exchangeContext?.accounts?.activeAccount;
};
