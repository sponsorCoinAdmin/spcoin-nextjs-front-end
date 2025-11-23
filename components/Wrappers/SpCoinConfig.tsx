// File: @/components/Wrappers/SpCoinConfig.tsx
'use client';

import * as React from 'react';
import { WagmiProvider, type Config } from 'wagmi';
import { ConnectKitProvider } from 'connectkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Props = {
  config: Config;                // wagmi v2 config from createConfig / getDefaultConfig
  children: React.ReactNode;
};

// singleton QueryClient for wagmi v2
const queryClient = new QueryClient();

/**
 * Provider-only wrapper.
 * IMPORTANT: Do NOT render anything here that calls useExchangeContext/useAppChainId.
 * Those must render BELOW ExchangeProvider.
 */
export default function SpCoinConfig({ config, children }: Props) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
