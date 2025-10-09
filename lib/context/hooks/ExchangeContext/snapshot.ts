import { useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';

export const useExchangeSnapshot = () => {
  const { exchangeContext } = useExchangeContext();
  return useMemo(() => exchangeContext, [exchangeContext]);
};
