// File: lib/context/hooks/nestedHooks/useApiProvider.ts

import { useExchangeContext } from '../useExchangeContext';
import { API_TRADING_PROVIDER } from '@/lib/structure';
import { debugHookChange } from '@/lib/utils/debugHookChange';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_API_PROVIDER === 'true';
const debugLog = createDebugLogger('useApiProvider', DEBUG_ENABLED, LOG_TIME);

export const useApiProvider = (): [API_TRADING_PROVIDER, (provider: API_TRADING_PROVIDER) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const apiProvider = exchangeContext?.settings?.apiTradingProvider ?? API_TRADING_PROVIDER.API_0X;

  const setApiProvider = (provider: API_TRADING_PROVIDER) => {
    if (!exchangeContext?.settings) return;

    setExchangeContext((prev) => {
      const oldValue = prev.settings.apiTradingProvider;

      debugLog.log(`reason: useApiProvider updating settings.apiTradingProvider from ${oldValue} to ${provider}`);
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
