'use client';

import React from 'react';
import AccountsPage from '@/components/Pages/AccountsPage';
import { useExchangeContext } from '@/lib/context/hooks';

export default function TestWalletsTab() {
  const { exchangeContext } = useExchangeContext();
  const activeAccount = exchangeContext?.accounts?.activeAccount;
  const activeAccountText =
    activeAccount?.name?.trim() ||
    activeAccount?.symbol?.trim() ||
    activeAccount?.address?.trim() ||
    'N/A';

  return (
    <div className="space-y-4">
      <div>
        <AccountsPage activeAccountText={activeAccountText} />
      </div>
    </div>
  );
}
