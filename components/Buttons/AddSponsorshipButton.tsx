// File: @/components/buttons/AddSponsorshipButton.tsx
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

  // 🔧 Always provide a non-empty parent/source tag to open/close.
  //    If a caller forgets to provide one, use this module's name.
  const DEFAULT_PARENT = 'components/buttons/AddSponsorshipButton';
  const asParent = (p?: string) => (p && p.trim().length > 0 ? p : DEFAULT_PARENT);

  const safeOpen = useCallback(
    (panel: SP_COIN_DISPLAY, parent?: string) => openPanel(panel, asParent(parent)),
    [openPanel]
  );

  const safeClose = useCallback(
    (panel: SP_COIN_DISPLAY, parent?: string) => closePanel(panel, asParent(parent)),
    [closePanel]
  );

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
      safeOpen(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON, `${DEFAULT_PARENT}:autoShow`);
    } else {
      safeClose(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON, `${DEFAULT_PARENT}:autoHide`);
    }

    appliedRef.current = next;
  }, [addr, buyToken, safeOpen, safeClose]);

  const onOpenInline = useCallback(() => {
    safeClose(
      SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON,
      `${DEFAULT_PARENT}:onOpenInline:closeLauncher`
    );
    safeOpen(
      SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL,
      `${DEFAULT_PARENT}:onOpenInline:openPanel`
    );
  }, [safeOpen, safeClose]);

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
