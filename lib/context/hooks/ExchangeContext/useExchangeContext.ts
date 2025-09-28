import { useContext } from 'react';
import { ExchangeContextState } from '../../ExchangeProvider';

export const useExchangeContext = () => {
  const context = useContext(ExchangeContextState);
  if (!context) {
    throw new Error('❌ useExchangeContext must be used within an ExchangeProvider');
  }
  return context;
};
