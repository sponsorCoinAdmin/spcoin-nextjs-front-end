// File: lib/hooks/useDisplayStateCorrection.ts

'use client';

import { useEffect } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import {
  validateDisplaySettings,
  resolveDisplaySettings,
} from '@/lib/context/helpers/displaySettingsHelpers';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers'; // ✅ added

export function useDisplayStateCorrection() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  useEffect(() => {
    const settings = exchangeContext.settings;

    console.debug(
      `🛠️ useDisplayStateCorrection → activeDisplay:`,
      getActiveDisplayString(settings.activeDisplay)
    ); // ✅ just log

    if (!validateDisplaySettings(settings)) {
      const resolved = resolveDisplaySettings(settings);
      setExchangeContext(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...resolved,
        },
      }));
    }
  }, [exchangeContext.settings, setExchangeContext]);
}
