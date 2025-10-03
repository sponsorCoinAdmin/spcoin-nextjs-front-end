// File: components/containers/ManageSponsorShipsPanel.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import { TokenContract } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SPONSOR_SELECT_PANEL_LIST === 'true';
const debugLog = createDebugLogger('ManageSponsorShipsPanel', DEBUG_ENABLED, LOG_TIME);

type Props = {
  /**
   * Optional external override. If omitted, visibility is driven by the panel tree.
   * Prefer omitting this so the component self-gates like other radio overlays.
   */
  showPanel?: boolean;
  tokenContract?: TokenContract;
  /** Kept for backward compatibility (currently unused) */
  callBackSetter?: (tc: TokenContract) => any;
  /** Optional external close hook */
  onClose?: () => void;
};

export default function ManageSponsorShipsPanel({
  showPanel,
  tokenContract,
  onClose,
}: Props) {
  const { isVisible, openPanel, closePanel } = usePanelTree();

  // Derive active state from panel tree unless an explicit prop is provided.
  const isActive = useMemo(
    () => (typeof showPanel === 'boolean'
      ? showPanel
      : isVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL)),
    [showPanel, isVisible]
  );

  debugLog.log('🛠️ ManageSponsorShipsPanel render; active =', isActive);

  useEffect(() => {
    if (!isActive) return;
    debugLog.log(
      '🎯 ManageSponsorShipsPanel active; token:',
      tokenContract?.symbol ?? '(none)'
    );
  }, [isActive, tokenContract]);

  if (!isActive) {
    debugLog.log('⏭️ ManageSponsorShipsPanel → not active, skipping render');
    return null;
  }

  const handleClose = () => {
    debugLog.log('✅ Close ManageSponsorShipsPanel');

    // Close this radio overlay. Do NOT force-open Trading Station — allow “no active overlay”.
    closePanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);

    // Re-show the launcher button so users can reopen the panel.
    openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);

    onClose?.();
  };

  return (
    <section
      id="ManageSponsorShipsPanel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ManageSponsorShipsPanelHeader"
      className="flex flex-col w-full rounded-[15px] overflow-hidden
                 border border-slate-500/30 bg-slate-900/30 text-slate-100"
    >
      <header
        id="ManageSponsorShipsPanelHeader"
        className="flex items-center justify-between px-4 py-3
                   bg-slate-800/50 border-b border-slate-600/30"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Manage Sponsorships</h3>
          {tokenContract?.symbol ? (
            <span className="text-xs opacity-80">for {tokenContract.symbol}</span>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Close panel"
          onClick={handleClose}
          className="h-7 w-7 inline-flex items-center justify-center rounded
                     border border-slate-400/30 text-slate-200
                     hover:text-white hover:border-slate-300 transition-colors"
        >
          ×
        </button>
      </header>

      <div className="p-4 flex flex-col gap-4">
        <div className="text-sm opacity-90">
          Configure sponsorships for this token. (Placeholder content)
        </div>

        <div className="rounded-lg border border-slate-500/30 p-3">
          <div className="text-sm font-medium mb-1">Selected token</div>
          <div className="text-xs opacity-80 break-all">
            {tokenContract
              ? `${tokenContract.name ?? 'Token'} (${tokenContract.symbol ?? '—'}) on chain ${
                  tokenContract.chainId ?? '—'
                }`
              : 'No token selected'}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 rounded-md bg-slate-700/80 hover:bg-slate-700 text-white text-sm
                       transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </section>
  );
}
