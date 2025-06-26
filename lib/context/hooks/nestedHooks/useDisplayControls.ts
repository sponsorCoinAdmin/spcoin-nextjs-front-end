import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export function useDisplayControls() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const updateAssetScrollDisplay = (value: SP_COIN_DISPLAY) => {
    setExchangeContext(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        assetSelectScrollDisplay: value,
      },
    }));
  };

  return {
    updateAssetScrollDisplay,
  };
}
