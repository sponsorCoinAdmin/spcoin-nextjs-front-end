import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export function useActiveDisplay() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const activeDisplay = exchangeContext.settings.activeDisplay;

  const updateActiveDisplay = (value: SP_COIN_DISPLAY) => {
    setExchangeContext(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        activeDisplay: value,
      },
    }));
  };

  return {
    activeDisplay,
    updateActiveDisplay,
  };
}
