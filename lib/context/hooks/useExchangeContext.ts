import { useContext } from 'react';
import { ExchangeContextState } from '../ExchangeContextProvider';

export const useExchangeContext = () => {
  const context = useContext(ExchangeContextState);
  if (!context) {
    throw new Error('❌ useExchangeContext must be used within an ExchangeWrapper');
  }
  return context;
};
