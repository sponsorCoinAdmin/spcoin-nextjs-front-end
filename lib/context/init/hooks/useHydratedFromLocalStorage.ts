// File: @/lib/context/init/hooks/ExchangeContext/useHydratedFromLocalStorage.ts
'use client';

import { useExchangeContext } from '@/lib/context/hooks';

/**
 * Returns true if the current ExchangeContext was hydrated
 * from Local Storage on boot, false if we started from defaults.
 */
export function useHydratedFromLocalStorage(): boolean {
  const { exchangeContext } = useExchangeContext();
  return !!exchangeContext.settings?.hydratedFromLocalStorage;
}

/**
 * Alias name if you prefer this spelling.
 */
export function useLocalStorageHydrated(): boolean {
  return useHydratedFromLocalStorage();
}
