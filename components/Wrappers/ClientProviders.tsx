// File: @/components/Wrappers/ClientProviders.tsx
'use client';

import React from 'react';
import { ExchangeProvider } from '@/lib/context/ExchangeProvider';
// (optional) import other client providers here:
// import { WagmiConfig } from 'wagmi';
// import { QueryClientProvider } from '@tanstack/react-query';
// import SpCoinConfig from '@/components/Wrappers/SpCoinConfig';

type Props = { children: React.ReactNode };

export default function ClientProviders({ children }: Props) {
  return (
    // Order matters: put ExchangeProvider ABOVE anything that reads the exchange context
    <ExchangeProvider>
      {/* Example: if you have SpCoinConfig or AppChainController, they must render INSIDE ExchangeProvider */}
      {/* <SpCoinConfig /> */}
      {children}
    </ExchangeProvider>
  );
}
