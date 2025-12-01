// File: @/lib/context/hooks/ExchangeContext/nested/useSettings.ts
'use client';

import { useCallback } from 'react';
import { useExchangeContext } from '../useExchangeContext';

// Infer the settings type from the context
type Settings = ReturnType<typeof useExchangeContext>['exchangeContext']['settings'];

type SettingsUpdater = Settings | ((prev: Settings) => Settings);

export function useSettings(): [Settings, (next: SettingsUpdater) => void] {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const settings = exchangeContext.settings as Settings;

  const setSettings = useCallback(
    (next: SettingsUpdater) => {
      setExchangeContext(
        (prev) => {
          const current = prev.settings as Settings;
          const updated =
            typeof next === 'function'
              ? (next as (p: Settings) => Settings)(current)
              : next;

          return {
            ...prev,
            settings: updated,
          };
        },
        'useSettings:setSettings',
      );
    },
    [setExchangeContext],
  );

  return [settings, setSettings];
}
