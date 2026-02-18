// File: @/app/(menu)/_providers/AppBootstrap.tsx
'use client';

import type { ReactNode } from 'react';

type AppBootstrapProps = {
  children?: ReactNode;
};

export function AppBootstrap(_props: AppBootstrapProps) {
  // Single-writer policy:
  // ExchangeProvider is the only owner/writer of exchangeContext.accounts.activeAccount.
  // AppBootstrap intentionally performs no account mirroring.
  return null;
}
