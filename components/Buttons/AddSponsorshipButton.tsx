// File: components/buttons/AddSponsorshipButton.tsx
'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';

import { useBuyTokenContract } from '@/lib/context/hooks';
import { isSpCoin } from '@/lib/spCoin/coreUtils';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * BUY-only launcher. Phase 7: scoped re-render via usePanelVisible + stable actions via usePanelTree.
 * Visibility rule: show iff the BUY token is an SpCoin. Ref guard prevents redundant flips.
 */
export default function AddSponsorshipButton() {
  const [buyToken] = useBuyTokenContract();
  const { openPanel, closePanel } = usePanelTree();

  // Re-render only when THIS launcher flag changes
  const launcherVisible = usePanelVisible(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON);

  // Stable identity key for current BUY token
  const addr = buyToken?.address?.toLowerCase() ?? '';

  // Apply visibility once per token/visibility change
  const appliedRef = useRef<{ addr: string; visible: boolean } | null>(null);
  useEffect(() => {
    const shouldShow = !!buyToken && isSpCoin(buyToken);
    const prev = appliedRef.current;
    const next = { addr, visible: shouldShow };
    if (prev && prev.addr === next.addr && prev.visible === next.visible) return;

    if (shouldShow) {
      openPanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON, 'AddSponsorshipButton');
    } else {
      closePanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON, 'AddSponsorshipButton');
    }

    appliedRef.current = next;
  }, [addr, openPanel, closePanel, buyToken]);

  const onOpenInline = useCallback(() => {
    closePanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON, 'AddSponsorshipButton:onOpenInline');
    openPanel(SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL, 'AddSponsorshipButton:onOpenInline');
  }, [openPanel, closePanel]);

  if (!launcherVisible) return null;

  return (
    <div
      id="addSponsorshipDiv"
      className={styles.addSponsorshipDiv}
      role="button"
      tabIndex={0}
      aria-label="Add Sponsorship"
      onClick={onOpenInline}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenInline();
        }
      }}
    >
      <div className={styles.centerTop}>Add</div>
      <div className={styles.centerBottom}>Sponsorship</div>
    </div>
  );
}
