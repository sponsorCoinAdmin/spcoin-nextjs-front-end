import { useExchangeContext } from './base';
import type { WalletAccount } from '@/lib/structure';

export const useRecipientAccount = (): [WalletAccount | undefined, (w: WalletAccount | undefined) => void] => {
  const { exchangeContext, setRecipientAccount } = useExchangeContext();
  return [exchangeContext?.accounts?.recipientAccount, setRecipientAccount];
};

export const useConnectedAccount = () => {
  const { exchangeContext } = useExchangeContext();
  return exchangeContext?.accounts?.connectedAccount;
};
