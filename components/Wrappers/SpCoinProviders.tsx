// File: components/Wrappers/SpCoinProviders.tsx
'use client';

import * as React from 'react';
import SpCoinConfig from '@/components/Wrappers/SpCoinConfig';
import { config } from '@/lib/wagmi/wagmiConfig';
import { PageStateProvider } from '@/lib/context/PageStateContext';
import { ActiveAccountProvider } from '@/lib/context/ActiveAccountContext';
import { ExchangeProvider } from '@/lib/context/ExchangeProvider';
import AppChainController from '@/lib/network/AppChainController';

export default function SpCoinProviders({ children }: { children: React.ReactNode }) {
  return (
    <SpCoinConfig config={config}>
      <PageStateProvider>
        <ActiveAccountProvider>
          <ExchangeProvider>
            {/* Anything that calls useExchangeContext/useAppChainId must be below this line */}
            <AppChainController />
            {children}
          </ExchangeProvider>
        </ActiveAccountProvider>
      </PageStateProvider>
    </SpCoinConfig>
  );
}
