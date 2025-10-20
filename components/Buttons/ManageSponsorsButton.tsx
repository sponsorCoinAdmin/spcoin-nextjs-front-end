// File: components/Buttons/ManageSponsorsButton.tsx
'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';

import { useSellTokenContract } from '@/lib/context/hooks';
import { isSpCoin } from '@/lib/spCoin/coreUtils';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * SELL-only launcher. Phase 7: scoped re-render using usePanelVisible, stable actions from usePanelTree.
 * Visibility rule: show iff the SELL token is an SpCoin. Ref guard prevents redundant flips.
 */
export default function ManageSponsorsButton() {
  const [sellToken] = useSellTokenContract();
  const { openPanel, closePanel } = usePanelTree();

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
      openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);
    } else {
      closePanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);
    }

    appliedRef.current = next;
  }, [addr, openPanel, closePanel, sellToken]);

  const onOpenManage = useCallback(() => {
    closePanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);
    openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  }, [openPanel, closePanel]);

  if (!launcherVisible) return null;

  return (
    <div
      id="manageSponsorshipsDiv"
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
