// File: lib/context/hooks/nestedHooks/useApiProvider.ts

import { useExchangeContext } from '../useExchangeContext';
import { API_TRADING_PROVIDER } from '@/lib/structure';
import { debugHookChange } from '@/lib/utils/debugHookChange';

export const useApiProvider = (): [API_TRADING_PROVIDER, (provider: API_TRADING_PROVIDER) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const apiProvider = exchangeContext?.settings?.apiTradingProvider ?? API_TRADING_PROVIDER.API_0X;

  const setApiProvider = (provider: API_TRADING_PROVIDER) => {
    if (!exchangeContext?.settings) return;

    setExchangeContext((prev) => {
      const oldValue = prev.settings.apiTradingProvider;
      debugHookChange('settings.apiTradingProvider', oldValue, provider);

      return {
        ...prev,
        settings: {
          ...prev.settings,
          apiTradingProvider: provider,
        },
      };
    });
  };

  return [apiProvider, setApiProvider];
};
