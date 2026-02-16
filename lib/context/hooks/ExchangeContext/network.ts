import { useExchangeContext } from '@/lib/context/hooks';

export const useNetwork = () => {
  const { exchangeContext } = useExchangeContext();
  return exchangeContext?.network;
};

