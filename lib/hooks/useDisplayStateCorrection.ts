// File: lib/hooks/useDisplayStateCorrection.ts

'use client';

import { useEffect } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import {
  validateDisplaySettings,
  resolveDisplaySettings,
} from '@/lib/context/helpers/displaySettingsHelpers';
import {
  normalizeActiveDisplay,
} from '@/lib/context/helpers/activeDisplayHelpers';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export function useDisplayStateCorrection() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  useEffect(() => {
    const settings = exchangeContext.settings;

    if (!validateDisplaySettings(settings)) {
      const resolved = resolveDisplaySettings(settings);

      const resolvedActiveDisplay =
        resolved.activeDisplay ??
        resolved.errorDisplay !== SP_COIN_DISPLAY.DISPLAY_OFF
          ? resolved.errorDisplay
          : resolved.assetSelectScrollDisplay !== SP_COIN_DISPLAY.DISPLAY_OFF
          ? resolved.assetSelectScrollDisplay
          : resolved.spCoinDisplay !== SP_COIN_DISPLAY.DISPLAY_OFF
          ? resolved.spCoinDisplay
          : SP_COIN_DISPLAY.TRADING_STATION_PANEL;

      setExchangeContext(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...resolved,
          activeDisplay: normalizeActiveDisplay(resolvedActiveDisplay),
        },
      }));
    }
  }, [exchangeContext.settings, setExchangeContext]);
}
