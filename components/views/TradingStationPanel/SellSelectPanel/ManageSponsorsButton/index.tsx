// File: @/components/views/TradingStationPanel/SellSelectPanel/ManageSponsorsButton/index.tsx
'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';

import { useSellTokenContract } from '@/lib/context/hooks';
import { isSpCoin } from '@/lib/spCoin/coreUtils';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * SELL-only launcher.
 * Visibility rule: show iff the SELL token is an SpCoin. Ref guard prevents redundant flips.
 *
 * Branch-backed close/revert:
 * - Do NOT close the launcher on click.
 * - Ensure the launcher is part of the branch path, then open the manage landing panel.
 *   This makes "close manage -> revert to launcher" work via branch replay.
 */
export default function ManageSponsorsButton() {
  const [sellToken] = useSellTokenContract();
  const { openPanel, closePanel } = usePanelTree();

  // ⚙️ Parent-tag rule: when not provided explicitly, use Module:Method(params)
  const safeOpen = useCallback(
    (panel: SP_COIN_DISPLAY, parent?: string) => {
      const parentTag = parent ?? `ManageSponsorsButton:safeOpen(${panel})`;
      openPanel(panel, parentTag);
    },
    [openPanel],
  );

  const safeClose = useCallback(
    (panel: SP_COIN_DISPLAY, parent?: string) => {
      const parentTag = parent ?? `ManageSponsorsButton:safeClose(${panel})`;
      closePanel(panel, parentTag);
    },
    [closePanel],
  );

  // Re-render only when THIS launcher flag changes
  const launcherVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);

  // Stable identity for current SELL token
  const addr = sellToken?.address?.toLowerCase() ?? '';

  // Apply launcher visibility once per token/visibility change
  const appliedRef = useRef<{ addr: string; visible: boolean } | null>(null);
  useEffect(() => {
    const shouldShow = !!sellToken && isSpCoin(sellToken);
    const prev = appliedRef.current;
    const next = { addr, visible: shouldShow };
    if (prev && prev.addr === next.addr && prev.visible === next.visible) return;

    if (shouldShow) {
      safeOpen(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);
    } else {
      safeClose(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);
    }

    appliedRef.current = next;
  }, [addr, sellToken, safeOpen, safeClose]);

  const onOpenManage = useCallback(() => {
    // IMPORTANT (branch model):
    // Keep the launcher in the branch path so closing Manage can revert to it.
    safeOpen(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON,
      'ManageSponsorsButton:onOpenManage(ensureLauncherInBranch)',
    );

    safeOpen(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      'ManageSponsorsButton:onOpenManage(openManageLandingPanel)',
    );
  }, [safeOpen]);

  if (!launcherVisible) return null;

  return (
    <div
      id="MANAGE_SPONSORSHIPS_BUTTON"
      className={styles.manageSponsorshipsDiv}
      role="button"
      tabIndex={0}
      aria-label="Manage Sponsorships"
      onClick={onOpenManage}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenManage();
        }
      }}
    >
      <div className={styles.centerTop}>Manage</div>
      <div className={styles.centerBottom}>Sponsorships</div>
    </div>
  );
}
