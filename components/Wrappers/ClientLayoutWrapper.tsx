'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/views/BrowserPanes/Header';
import { ExchangeProvider } from '@/lib/context/ExchangeProvider';

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSponsorCoin = pathname === '/SponsorCoin';

  return (
    <ExchangeProvider>
      <Header />
      {isSponsorCoin ? (
        children
      ) : (
        <Suspense fallback={<div className="p-8 text-white text-center">Loading page...</div>}>
          {children}
        </Suspense>
      )}
    </ExchangeProvider>
  );
}
