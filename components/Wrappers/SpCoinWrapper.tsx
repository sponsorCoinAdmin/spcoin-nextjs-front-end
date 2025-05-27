// File: components/Wrappers/SpCoinWrapper.tsx

'use client';

import { WagmiProvider } from 'wagmi';
import { ConnectKitProvider } from 'connectkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi/wagmiConfig';
import { ExchangeWrapper } from '@/lib/context/ExchangeContext';
import { PageStateProvider } from '@/lib/context/PageStateContext'; // ✅ new context

export default function SpCoinWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <PageStateProvider> {/* ✅ added */}
            <ExchangeWrapper>
              {children}
            </ExchangeWrapper>
          </PageStateProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
