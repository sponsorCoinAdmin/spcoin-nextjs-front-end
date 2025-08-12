// File: app/(menu)/Test/Tabs/TestWallets/index.tsx
'use client';

import React, { useCallback } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';
import WalletsPage from '@/components/Pages/WalletsPage';

const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056]';

export default function TestWalletsTab() {
  const { setState } = usePageState();

  const updateExchangePage = useCallback((updates: any) => {
    setState((prev: any) => ({
      ...prev,
      page: {
        ...prev?.page,
        exchangePage: {
          ...(prev?.page?.exchangePage ?? {}),
          ...updates,
        },
      },
    }));
  }, [setState]);

  const hideWallets = useCallback(() => {
    updateExchangePage({ showWallets: false });
  }, [updateExchangePage]);

  return (
    <div className="space-y-4">
      <div className="w-full flex justify-center">
        <button onClick={hideWallets} className={buttonClasses}>
          Hide Test Wallets
        </button>
      </div>

      <div className="w-screen bg-[#1f2639] border border-gray-700 rounded-none shadow-inner p-4 m-0">
        <WalletsPage />
      </div>
    </div>
  );
}
