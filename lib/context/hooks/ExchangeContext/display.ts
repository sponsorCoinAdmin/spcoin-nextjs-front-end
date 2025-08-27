import { useCallback } from 'react';
import { useExchangeContext } from './base';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export const useActiveDisplay = (): [SP_COIN_DISPLAY | undefined, (v: SP_COIN_DISPLAY) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const value = exchangeContext?.settings?.activeDisplay;
  const setter = useCallback((v: SP_COIN_DISPLAY) => {
    setExchangeContext((p) => {
      p.settings.activeDisplay = v;
      return p;
    }, 'useActiveDisplay');
  }, [setExchangeContext]);
  return [value, setter];
};
