// File: @/components/views/TradingStationPanel/BuySelectPanel/AddSponsorshipButton/index.tsx
'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';

import { useBuyTokenContract } from '@/lib/context/hooks';
import { isSpCoin } from '@/lib/spCoin/coreUtils';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * BUY-only launcher.
 * Visibility rule: show iff the BUY token is an SpCoin.
 *
 * IMPORTANT:
 * - This launcher is NOT stack navigation.
 * - We no longer expose show/hide visibility-only primitives.
 * - So we use openPanel/closePanel(panel) to flip this display.
 */
export default function AddSponsorshipButton() {
  const [buyToken] = useBuyTokenContract();

  const { openPanel, closePanel } = usePanelTree();

  // 🔧 Always provide a non-empty invoker tag to open/close.
  const DEFAULT_INVOKER = 'components/buttons/AddSponsorshipButton';
  const asInvoker = (s?: string) => (s && s.trim().length > 0 ? s : DEFAULT_INVOKER);

  const safeOpen = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string) => openPanel(panel, asInvoker(invoker)),
    [openPanel],
  );

  const safeClose = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string) => closePanel(panel, asInvoker(invoker)),
    [closePanel],
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
      safeOpen(
        SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON,
        `${DEFAULT_INVOKER}:autoShow`,
      );
    } else {
      safeClose(
        SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON,
        `${DEFAULT_INVOKER}:autoHide`,
      );
    }

    appliedRef.current = next;
  }, [addr, buyToken, safeOpen, safeClose]);

  const onOpenInline = useCallback(() => {
    // Close launcher, then open the panel
    safeClose(
      SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON,
      `${DEFAULT_INVOKER}:onOpenInline:closeLauncher`,
    );

    safeOpen(
      SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL,
      `${DEFAULT_INVOKER}:onOpenInline:openPanel`,
    );
  }, [safeOpen, safeClose]);

  if (!launcherVisible) return null;

  return (
    <div
      id="ADD_SPONSORSHIP_BUTTON"
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
