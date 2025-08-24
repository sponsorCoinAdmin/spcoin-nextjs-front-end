'use client';

import React, { useCallback } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';
import WalletsPage from '@/components/Pages/WalletsPage';

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
      {/* Top bar — match PanelsTab: centered controls (none) + X at top-right, shifted UP 15px */}
      <div className="relative w-full -mt-[15px]">
        {/* Centered controls (reserved for future buttons) */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-2">
          {/* No buttons here yet; this keeps layout consistent with other tabs */}
        </div>
        {/* Top-right Close "X" (double text size like other panels) */}
        <button
          onClick={hideWallets}
          aria-label="Close Test Wallets"
          title="Close Test Wallets"
          className="absolute top-1 right-1 h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] flex items-center justify-center leading-none
                     hover:bg-[#5981F3] hover:text-[#243056] transition-colors text-3xl"
        >
          ×
        </button><br/>
      </div>

      {/* Optional divider under toolbar for consistency */}

      <div>
        <WalletsPage />
      </div>
    </div>
  );
}
