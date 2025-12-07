// File: @/components/Wrappers/SpCoinProviders.tsx
'use client';

import * as React from 'react';
import SpCoinConfig from '@/components/Wrappers/SpCoinConfig';
import { config } from '@/lib/wagmi/wagmiConfig';
import { PageStateProvider } from '@/lib/context/PageStateContext';
import { ActiveAccountProvider } from '@/lib/context/ActiveAccountContext';
import { ExchangeProvider } from '@/lib/context/ExchangeProvider';
import { AppNetworkController } from '@/lib/network/initialize/appNetworkController';

export default function SpCoinProviders({ children }: { children: React.ReactNode }) {
  return (
    <SpCoinConfig config={config}>
      <PageStateProvider>
        <ActiveAccountProvider>
          <ExchangeProvider>
            {/* Network policy brain (Cases A–E) lives here */}
            <AppNetworkController />
            {children}
          </ExchangeProvider>
        </ActiveAccountProvider>
      </PageStateProvider>
    </SpCoinConfig>
  );
}
