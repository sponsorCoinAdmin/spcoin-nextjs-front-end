// File: components/containers/ManageSponsorshipsPanel.tsx
'use client';

import React, { useEffect } from 'react';
import { TokenContract } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SPONSOR_SELECT_PANEL_LIST === 'true';
const debugLog = createDebugLogger('ManageSponsorshipsPanel', DEBUG_ENABLED, LOG_TIME);

type Props = {
  /** Optional: show token context if parent has one available */
  tokenContract?: TokenContract;
  /** Optional: external close hook */
  onClose?: () => void;
};

export default function ManageSponsorshipsPanel({ tokenContract, onClose }: Props) {
  // ✅ Phase 7: subscribe to just this panel's visibility (no broad context reads)
  const isActive = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const { closeManageSponsorships } = usePanelTransitions();

  debugLog.log('🛠️ ManageSponsorshipsPanel render; active =', isActive);

  useEffect(() => {
    if (!isActive) return;
    debugLog.log(
      '🎯 ManageSponsorshipsPanel active; token:',
      tokenContract?.symbol ?? '(none)'
    );
  }, [isActive, tokenContract]);

  if (!isActive) {
    debugLog.log('⏭️ ManageSponsorshipsPanel → not active, skipping render');
    return null;
  }

  const handleClose = () => {
    debugLog.log('✅ Close ManageSponsorshipsPanel via transition');
    closeManageSponsorships();
    onClose?.();
  };

  return (
    <section
      id="ManageSponsorshipsPanel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ManageSponsorshipsPanelHeader"
      className="flex flex-col w-full rounded-[15px] overflow-hidden
                 border border-slate-500/30 bg-slate-900/30 text-slate-100"
    >
      <header
        id="ManageSponsorshipsPanelHeader"
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
