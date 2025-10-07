// File: components/Buttons/ManageSponsorsButton.tsx
'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';

import { useSellTokenContract } from '@/lib/context/hooks';
import { isSpCoin } from '@/lib/spCoin/coreUtils';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

/**
 * Lives only in the SELL panel.
 * Visibility rule: show iff the SELL token is an SpCoin.
 * We update the panel-tree enum once per token/visibility change using a ref guard
 * to avoid update loops and cross-panel contention.
 */
export default function ManageSponsorsButton() {
  const [sellToken] = useSellTokenContract();
  const { isVisible, openPanel, closePanel } = usePanelTree();

  // Stable primitives
  const addr = sellToken?.address?.toLowerCase() ?? '';

  // Apply visibility once per token change (no dependency on isVisible/buttonOn)
  const appliedRef = useRef<{ addr: string; visible: boolean } | null>(null);
  
  useEffect(() => {
  const shouldShow = sellToken ? isSpCoin(sellToken) : false;
    const prev = appliedRef.current;
    const next = { addr, visible: shouldShow };
    const changed = !prev || prev.addr !== next.addr || prev.visible !== next.visible;
    if (!changed) return;

    if (shouldShow) {
      openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);
    } else {
      closePanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);
    }

    appliedRef.current = next;
  }, [addr]);

  const onOpenManage = useCallback(() => {
      closePanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);
      openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  }, [openPanel, closePanel]);

  // Render only when launcher enum is on
  if (!isVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON)) return null;

  return (
    <div
      id="manageSponsorshipsDiv"
      className={styles.manageSponsorshipsDiv}
      role="button"
      tabIndex={0}
      aria-label="Manage Sponsorships"
      onClick={onOpenManage}
    >
      <div className={styles.centerTop}>Manage</div>
      <div className={styles.centerBottom}>Sponsorships</div>
    </div>
  );
}
