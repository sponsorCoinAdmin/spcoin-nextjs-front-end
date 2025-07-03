import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export function useDisplayControls() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  // 🟩 Current values (getters)
  const spCoinDisplay = exchangeContext.settings.spCoinDisplay;
  const assetSelectScrollDisplay = exchangeContext.settings.assetSelectScrollDisplay;
  const errorDisplay = exchangeContext.settings.errorDisplay;

  // 🟦 Setters
  const updateSpCoinDisplay = (value: SP_COIN_DISPLAY) => {
    setExchangeContext(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        spCoinDisplay: value,
      },
    }));
  };

  const updateAssetScrollDisplay = (value: SP_COIN_DISPLAY) => {
    setExchangeContext(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        assetSelectScrollDisplay: value,
      },
    }));
  };

  const updateErrorDisplay = (value: SP_COIN_DISPLAY) => {
    setExchangeContext(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        errorDisplay: value,
      },
    }));
  };

  return {
    spCoinDisplay,
    assetSelectScrollDisplay,
    errorDisplay,
    updateSpCoinDisplay,
    updateAssetScrollDisplay,
    updateErrorDisplay,
  };
}
