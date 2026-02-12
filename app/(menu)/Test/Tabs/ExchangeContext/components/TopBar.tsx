// File: @/app/(menu)/Test/Tabs/ExchangeContext/components/TopBar.tsx
'use client';

import React, { useCallback } from 'react';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056]';

type Props = {
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleGui: () => void;
  showGui: boolean;
  onLog: () => void;
  onClose: () => void;
};

const TopBar: React.FC<Props> = ({
  expanded,
  onToggleExpand,
  onToggleGui,
  showGui,
  onLog,
  onClose,
}) => {
  // Panel branch dump (debug)
  const { dumpNavStack } = usePanelTree();

  const dumpStack = useCallback(() => {
    if (typeof dumpNavStack === 'function') {
      dumpNavStack();
      return;
    }

    // eslint-disable-next-line no-console
    console.warn(
      '[TopBar] Panel stack dump not available. Add dumpNavStack() to usePanelTree().',
    );
  }, [dumpNavStack]);

  return (
    <div className="relative w-full -mt-[15px]">
      <div className="flex flex-wrap items-center justify-center gap-4 py-2">
        <button onClick={onToggleExpand} className={buttonClasses}>
          {expanded ? 'Collapse Context' : 'Expand Context'}
        </button>

        <button onClick={onToggleGui} className={buttonClasses}>
          {showGui ? 'Hide GUI' : 'Show GUI'}
        </button>

        <button onClick={onLog} className={buttonClasses}>
          Log Context
        </button>

        <button onClick={dumpStack} className={buttonClasses}>
          Panel Stack Dump
        </button>
      </div>

      <button
        onClick={onClose}
        aria-label="Close Context"
        title="Close Context"
        className="absolute top-1 right-1 h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] flex items-center justify-center leading-none
                   hover:bg-[#5981F3] hover:text-[#243056] transition-colors text-3xl"
        type="button"
      >
        ×
      </button>
    </div>
  );
};

export default TopBar;
