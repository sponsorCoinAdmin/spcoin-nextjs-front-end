// File: app/(menu)/Test/Tabs/Panels/index.tsx
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
      <div className="w-full flex justify-center">
        <button onClick={hidePanels} className={buttonClasses}>
          Hide Panels
        </button>
      </div>

      {/* Your Panels content goes here */}
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
