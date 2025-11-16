import { useExchangeContext } from '@/lib/context/hooks';
import type { WalletAccount } from '@/lib/structure';

export const useRecipientAccount = (): [WalletAccount | undefined, (w: WalletAccount | undefined) => void] => {
  const { exchangeContext, setRecipientAccount } = useExchangeContext();
  return [exchangeContext?.accounts?.recipientAccount, setRecipientAccount];
};

export const useActiveAccount = () => {
  const { exchangeContext } = useExchangeContext();
  return exchangeContext?.accounts?.activeAccount;
};
