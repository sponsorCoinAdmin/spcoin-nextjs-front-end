'use client';

import { WagmiProvider } from 'wagmi';
import { ConnectKitProvider } from 'connectkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { config } from '@/lib/wagmi/wagmiConfig';
import { ConnectedAccountProvider } from '@/lib/context/ConnectedAccountContext'; // ✅ new import
import { ExchangeWrapper } from '@/lib/context/ExchangeContext';
import { PageStateProvider } from '@/lib/context/PageStateContext';

export default function SpCoinWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <PageStateProvider>
            <ConnectedAccountProvider> {/* ✅ inserted */}
              <ExchangeWrapper>
                {children}
              </ExchangeWrapper>
            </ConnectedAccountProvider>
          </PageStateProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
