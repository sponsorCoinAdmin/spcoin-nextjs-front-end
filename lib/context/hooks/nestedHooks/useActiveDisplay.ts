import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY_NEW } from '@/lib/structure';

export function useActiveDisplay() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const activeDisplay = exchangeContext.settings.activeDisplay;

  const setActiveDisplay = (value: SP_COIN_DISPLAY_NEW) => {
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
    setActiveDisplay,
  };
}
