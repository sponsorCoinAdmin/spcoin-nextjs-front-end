// File: lib/hooks/useDisplayStateCorrection.ts

'use client';

import { useEffect } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import {
  validateDisplaySettings,
  resolveDisplaySettings,
} from '@/lib/context/helpers/displaySettingsHelpers';

export function useDisplayStateCorrection() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  useEffect(() => {
    const settings = exchangeContext.settings;

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
