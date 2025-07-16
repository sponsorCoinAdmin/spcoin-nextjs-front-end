// File: lib/hooks/useDisplayControls.ts

import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';

export function useDisplayControls() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  // 🟩 Current values (getters)
  const spCoinDisplay = exchangeContext.settings.spCoinDisplay;
  const assetSelectScrollDisplay = exchangeContext.settings.assetSelectScrollDisplay;
  const errorDisplay = exchangeContext.settings.errorDisplay;
  const activeDisplay = exchangeContext.settings.activeDisplay; // ✅ added but not yet functionally used

  // 🟥 Setters (no functional change yet, just placeholder for future)
  const updateSpCoinDisplay = (value: SP_COIN_DISPLAY) => {
    setExchangeContext(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        spCoinDisplay: value,
        // activeDisplay: value, // ⚡ not yet functionally enabled
      },
    }));
  };

  const updateAssetScrollDisplay = (value: SP_COIN_DISPLAY) => {
    const beforeValue = exchangeContext.settings.assetSelectScrollDisplay;
    const beforeStr = SP_COIN_DISPLAY[beforeValue] || `UNKNOWN(${beforeValue})`;
    const afterStr = SP_COIN_DISPLAY[value] || `UNKNOWN(${value})`;

    console.log(`🔧 updateAssetScrollDisplay(${value}) called with: ${afterStr}`);
    console.log(`⚡ setAssetSelectScrollDisplay → BEFORE: ${beforeValue} (${beforeStr}), AFTER: ${value} (${afterStr})`);

    setExchangeContext(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        assetSelectScrollDisplay: value,
        // activeDisplay: value, // ⚡ not yet functionally enabled
      },
    }));
  };

  const updateErrorDisplay = (value: SP_COIN_DISPLAY) => {
    setExchangeContext(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        errorDisplay: value,
        // activeDisplay: value, // ⚡ not yet functionally enabled
      },
    }));
  };

  return {
    spCoinDisplay,
    assetSelectScrollDisplay,
    errorDisplay,
    activeDisplay, // ✅ added getter, no functional use yet
    updateSpCoinDisplay,
    updateAssetScrollDisplay,
    updateErrorDisplay,
  };
}
