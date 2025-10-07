// File: components/buttons/AddSponsorshipButton.tsx
'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';

import { useBuyTokenContract } from '@/lib/context/hooks';
import { isSpCoin } from '@/lib/spCoin/coreUtils';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

/**
 * Lives only in the BUY panel.
 * Visibility rule: show iff the BUY token is an SpCoin.
 * We update the panel-tree enum once per token/visibility change using a ref guard,
 * mirroring ManageSponsorsButton's behavior.
 */
export default function AddSponsorshipButton() {
  const [buyToken] = useBuyTokenContract();
  const { isVisible, openPanel, closePanel } = usePanelTree();

  // Stable identity key for the BUY token
  const addr = buyToken?.address?.toLowerCase() ?? '';

  // Apply visibility once per token change (no dependency on isVisible/buttonOn)
  const appliedRef = useRef<{ addr: string; visible: boolean } | null>(null);
  useEffect(() => {
    const shouldShow = buyToken ? isSpCoin(buyToken) : false;
    const prev = appliedRef.current;
    const next = { addr, visible: shouldShow };
    const changed = !prev || prev.addr !== next.addr || prev.visible !== next.visible;
    if (!changed) return;

    if (shouldShow) {
      openPanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON);
    } else {
      closePanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON);
    }

    appliedRef.current = next;
  }, [addr]);

  const onOpenInline = useCallback(() => {
    // Hide launcher, open inline panel (mirrors Manage's click behavior)
    closePanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON);
    openPanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL);
  }, [openPanel, closePanel]);

  // Render only when launcher enum is on
  if (!isVisible(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON)) return null;

  return (
    <div
      id="addSponsorshipDiv"
      className={styles.addSponsorshipDiv}
      role="button"
      tabIndex={0}
      aria-label="Add Sponsorship"
      onClick={onOpenInline}
    >
      <div className={styles.centerTop}>Add</div>
      <div className={styles.centerBottom}>Sponsorship</div>
    </div>
  );
}
