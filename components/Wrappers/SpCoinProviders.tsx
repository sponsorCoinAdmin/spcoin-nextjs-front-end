// File: components/Wrappers/SpCoinProviders.tsx
'use client';

import * as React from 'react';
import SpCoinConfig from '@/components/Wrappers/SpCoinConfig';
import WalletActionOverlay from '@/components/views/WalletActionOverlay';
import SpCoinWalletPopup from '@/components/views/SpCoinWalletPopup';
import { ActiveAccountProvider } from '@/lib/context/ActiveAccountContext';
import { ExchangeProvider } from '@/lib/context/ExchangeProvider';
import { PageStateProvider } from '@/lib/context/PageStateContext';
import { WalletActionOverlayProvider } from '@/lib/context/WalletActionOverlayContext';
import { AppNetworkController } from '@/lib/network/initialize/appNetworkController';
import { SpCoinWalletProvider } from '@/lib/spCoinWallet';
import { config } from '@/lib/wagmi/wagmiConfig';

export default function SpCoinProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SpCoinConfig config={config}>
      <PageStateProvider>
        <ActiveAccountProvider>
          <WalletActionOverlayProvider>
            <ExchangeProvider>
              <SpCoinWalletProvider>
                <AppNetworkController />
                {children}
                <SpCoinWalletPopup />
                <WalletActionOverlay />
              </SpCoinWalletProvider>
            </ExchangeProvider>
          </WalletActionOverlayProvider>
        </ActiveAccountProvider>
      </PageStateProvider>
    </SpCoinConfig>
  );
}

