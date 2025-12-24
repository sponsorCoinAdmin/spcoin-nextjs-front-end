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

  /** NEW: controls the left panel (Exchange) visibility */
  onToggleExchange?: () => void;
  showExchange?: boolean;
};

const TopBar: React.FC<Props> = ({
  expanded,
  onToggleExpand,
  onToggleGui,
  showGui,
  onLog,
  onClose,
  onToggleExchange,
  showExchange,
}) => {
  // Safe fallbacks so this file doesn't break callers until they wire the new props.
  const handleToggleExchange = onToggleExchange ?? (() => {});
  const isExchangeVisible = showExchange ?? true;

  // Panel stack dump (debug)
  const panelTree = usePanelTree() as any;
  const dumpStack = useCallback(() => {
    // Preferred: hook-provided dumper (if you added it)
    if (typeof panelTree?.dumpNavStack === 'function') {
      panelTree.dumpNavStack('TopBar:Panel Stack Dump');
      return;
    }

    // Fallback: if a getter exists, print it
    if (typeof panelTree?.getNavStack === 'function') {
      const raw = panelTree.getNavStack();
      const named = (raw ?? []).map((id: number) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (panelTree?.SP_COIN_DISPLAY?.[id] as string) ?? String(id),
      );
      // eslint-disable-next-line no-console
      console.log('[TopBar] NAV STACK (fallback)', {
        tag: 'TopBar:Panel Branch Dump',
        raw,
        named,
      });
      return;
    }

    // Last resort
    // eslint-disable-next-line no-console
    console.warn(
      '[TopBar] Panel stack dump not available. Add dumpNavStack() to usePanelTree().',
    );
  }, [panelTree]);

  return (
    <div className="relative w-full -mt-[15px]">
      <div className="flex flex-wrap items-center justify-center gap-4 py-2">
        <button onClick={onToggleExpand} className={buttonClasses}>
          {expanded ? 'Collapse Context' : 'Expand Context'}
        </button>

        {/* NEW: Hide/Show Exchange Context (left panel) */}
        <button onClick={handleToggleExchange} className={buttonClasses}>
          {isExchangeVisible ? 'Hide Context' : 'Show Context'}
        </button>

        <button onClick={onToggleGui} className={buttonClasses}>
          {showGui ? 'Hide GUI' : 'Show GUI'}
        </button>

        <button onClick={onLog} className={buttonClasses}>
          Log Context
        </button>

        {/* DEBUG: Panel stack */}
        <button onClick={dumpStack} className={buttonClasses}>
          Panel Stack Dump
        </button>
      </div>

      {/* Close */}
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
