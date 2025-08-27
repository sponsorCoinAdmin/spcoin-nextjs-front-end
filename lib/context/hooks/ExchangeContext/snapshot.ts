import { useMemo } from 'react';
import { useExchangeContext } from './base';

export const useExchangeSnapshot = () => {
  const { exchangeContext } = useExchangeContext();
  return useMemo(() => exchangeContext, [exchangeContext]);
};
