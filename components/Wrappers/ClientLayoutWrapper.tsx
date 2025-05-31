'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/panes/header';
import { ExchangeWrapper } from '@/lib/context';

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSponsorCoin = pathname === '/SponsorCoin';

  return (
    <ExchangeWrapper>
      <Header />
      {isSponsorCoin ? (
        children
      ) : (
        <Suspense fallback={<div className="p-8 text-white text-center">Loading page...</div>}>
          {children}
        </Suspense>
      )}
    </ExchangeWrapper>
  );
}
