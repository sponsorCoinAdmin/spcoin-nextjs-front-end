import { useContext } from 'react';
import { ExchangeContextState, type ExchangeContextType } from '@/lib/context/ExchangeProvider';

export const useExchangeContext = (): ExchangeContextType => {
  const ctx = useContext(ExchangeContextState);
  if (!ctx) throw new Error('❌ useExchangeContext must be used within an ExchangeProvider');
  return ctx;
};
