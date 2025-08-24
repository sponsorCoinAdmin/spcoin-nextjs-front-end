'use client';

import React, { useCallback } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';

const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056]';

export default function PanelsTab() {
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

  const hidePanels = useCallback(() => {
    updateExchangePage({ showPanels: false });
  }, [updateExchangePage]);

  return (
    <div className="space-y-4">
      {/* Top bar: match other tabs — centered controls (none for now) + X at top-right, shifted up 15px */}
      <div className="relative w-full -mt-[15px]">
        {/* Centered controls (reserved for future buttons) */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-2">
          {/* No buttons here yet; this keeps layout consistent with other tabs */}
        </div>

        {/* Top-right Close "X" (double text size) */}
        <button
          onClick={hidePanels}
          aria-label="Close Panels"
          title="Close Panels"
          className="absolute top-1 right-1 h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] flex items-center justify-center leading-none
                     hover:bg-[#5981F3] hover:text-[#243056] transition-colors text-3xl"
        >
          ×
        </button>
      </div>

      {/* Panels content */}
      <div className="w-full bg-[#1f2639] border border-gray-700 rounded-md shadow-inner p-4">
        <div className="text-center text-sm opacity-70">Panels content</div>
        <h2 className="text-lg font-semibold mb-2 text-[#5981F3]">Panels (WIP)</h2>
        <p className="text-sm text-[#a9b3d1]">
          This is a placeholder for future panel management UI. Add your controls/components here.
        </p>
      </div>
    </div>
  );
}
