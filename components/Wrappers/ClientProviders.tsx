// File: @/components/Wrappers/ClientProviders.tsx
'use client';

import React from 'react';
import { ExchangeProvider } from '@/lib/context/ExchangeProvider';

type Props = { children: React.ReactNode };

export default function ClientProviders({ children }: Props) {
  return (
    <ExchangeProvider>
      {children}
    </ExchangeProvider>
  );
}
