// File: lib/context/hooks/nestedHooks/useApiProvider.ts

import { useExchangeContext } from '../useExchangeContext';
import { API_TRADING_PROVIDER } from '@/lib/structure';

export const useApiProvider = (): [API_TRADING_PROVIDER, (provider: API_TRADING_PROVIDER) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const apiProvider = exchangeContext.settings.apiTradingProvider;

  const setApiProvider = (provider: API_TRADING_PROVIDER) => {
    setExchangeContext((prev) => ({
      ...prev,
      apiTradingProvider: provider, // ✅ fixed
    }));
  };

  return [apiProvider, setApiProvider];
};
