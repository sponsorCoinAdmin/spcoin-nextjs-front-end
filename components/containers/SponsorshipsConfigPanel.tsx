// File: components/containers/SponsorshipsConfigPanel.tsx
'use client';

import React, { useEffect } from 'react';
import { TokenContract } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SPONSORSHIPS_CONFIG_PANEL === 'true';
const debugLog = createDebugLogger('SponsorshipsConfigPanel', DEBUG_ENABLED, LOG_TIME);

type Props = {
  /** Panel-tree controlled visibility, like ErrorMessagePanel's `isActive` */
  showPanel: boolean;
  tokenContract: TokenContract | undefined;
  /** Placeholder to keep compatibility with callers */
  callBackSetter?: (tc: TokenContract) => any;
  /** Optional external close hook */
  onClose?: () => void;
};

export default function SponsorshipsConfigPanel({
  showPanel,
  tokenContract,
  callBackSetter,
  onClose,
}: Props) {
  const { openPanel, closePanel } = usePanelTree();

  debugLog.log('🛠️ SponsorshipsConfigPanel render; showPanel=', showPanel);

  useEffect(() => {
    if (!showPanel) return;
    debugLog.log('🎯 SponsorshipsConfigPanel active; token:', tokenContract?.symbol ?? '(none)');
  }, [showPanel, tokenContract]);

  if (!showPanel) {
    debugLog.log('⏭️ SponsorshipsConfigPanel → not active, skipping render');
    return null;
  }

  const handleClose = () => {
    debugLog.log('✅ Close SponsorshipsConfigPanel → back to TRADING_STATION_PANEL');
    // Mirror ErrorMessagePanel: close self, then open Trading Station
    closePanel(SP_COIN_DISPLAY.SPONSORSHIPS_CONFIG_PANEL);
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
    onClose?.();
  };

  return (
    <section
      id="SponsorshipsConfigPanel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="SponsorshipsConfigPanelHeader"
      className="flex flex-col w-full rounded-[15px] overflow-hidden
                 border border-slate-500/30 bg-slate-900/30 text-slate-100"
    >
      {/* Header — this was missing */}
      <header
        id="SponsorshipsConfigPanelHeader"
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

      {/* Body */}
      <div className="p-4 flex flex-col gap-4">
        {/* Replace with real sponsorship management UI */}
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
