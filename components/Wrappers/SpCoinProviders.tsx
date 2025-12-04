// File: @/components/Wrappers/SpCoinProviders.tsx
'use client';

import * as React from 'react';
import SpCoinConfig from '@/components/Wrappers/SpCoinConfig';
import { config } from '@/lib/wagmi/wagmiConfig';
import { PageStateProvider } from '@/lib/context/PageStateContext';
import { ActiveAccountProvider } from '@/lib/context/ActiveAccountContext';
import { ExchangeProvider } from '@/lib/context/ExchangeProvider';

export default function SpCoinProviders({ children }: { children: React.ReactNode }) {
  return (
    <SpCoinConfig config={config}>
      <PageStateProvider>
        <ActiveAccountProvider>
          <ExchangeProvider>
            {children}
          </ExchangeProvider>
        </ActiveAccountProvider>
      </PageStateProvider>
    </SpCoinConfig>
  );
}
