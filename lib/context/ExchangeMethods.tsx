// File: lib/context/ExchangeMethods.tsx

'use client';

import React from 'react';
import { useActiveAccount } from '@/lib/context/hooks/nestedHooks/useActiveAccount';

/**
 * ExchangeMethods is a logic-only component that safely mounts side-effect hooks
 * after ExchangeContext is already available via ExchangeWrapper.
 *
 * Currently:
 * - Injects the connectedAccount using useActiveAccount
 */
export default function ExchangeMethods({ children }: { children: React.ReactNode }) {
  // ✅ Hook assumes ExchangeWrapper is already mounted
  useActiveAccount();

  return <>{children}</>;
}
