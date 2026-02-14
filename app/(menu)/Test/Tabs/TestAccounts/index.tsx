'use client';

import React from 'react';
import AccountsPage, { type AccountFilter } from '@/components/Pages/AccountsPage';
import { useExchangeContext } from '@/lib/context/hooks';

type TestWalletsTabProps = {
  selectedFilter?: AccountFilter;
  onSelectedFilterChange?: (next: AccountFilter) => void;
};

export default function TestWalletsTab({
  selectedFilter,
  onSelectedFilterChange,
}: TestWalletsTabProps) {
  const { exchangeContext } = useExchangeContext();
  const activeAccount = exchangeContext?.accounts?.activeAccount;
  const activeAccountText = activeAccount?.address?.trim() || 'N/A';

  return (
    <div className="space-y-4">
      <div>
        <AccountsPage
          activeAccountText={activeAccountText}
          selectedFilter={selectedFilter}
          onSelectedFilterChange={onSelectedFilterChange}
          showFilterControls={false}
        />
      </div>
    </div>
  );
}
