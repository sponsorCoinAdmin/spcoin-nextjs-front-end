// File: lib/hooks/validationStateHooks/useDebouncedAddress

'use client';

import { useDebounce } from '@/lib/hooks/useDebounce';

export function useDebouncedAddress(selectAddress: string | undefined, delay = 250): string {
  return useDebounce(selectAddress || '', delay);
}
