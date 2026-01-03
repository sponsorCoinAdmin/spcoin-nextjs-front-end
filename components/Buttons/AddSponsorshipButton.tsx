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
 * BUY-only launcher.
 * Visibility rule: show iff the BUY token is an SpCoin.
 *
 * IMPORTANT:
 * - This launcher is NOT a stack navigation item.
 * - So it must use showPanel/hidePanel (visibility-only),
 *   NOT openPanel/closePanel (stack-aware).
 */
export default function AddSponsorshipButton() {
  const [buyToken] = useBuyTokenContract();

  // ✅ Use visibility-only primitives for non-stack panels (like this launcher button)
  const { openPanel, showPanel, hidePanel } = usePanelTree();

  // 🔧 Always provide a non-empty parent/source tag to show/hide/open.
  const DEFAULT_PARENT = 'components/buttons/AddSponsorshipButton';
  const asParent = (p?: string) => (p && p.trim().length > 0 ? p : DEFAULT_PARENT);

  const safeShow = useCallback(
    (panel: SP_COIN_DISPLAY, parent?: string) => showPanel(panel, asParent(parent)),
    [showPanel],
  );

  const safeHide = useCallback(
    (panel: SP_COIN_DISPLAY, parent?: string) => hidePanel(panel, asParent(parent)),
    [hidePanel],
  );

  const safeOpen = useCallback(
    (panel: SP_COIN_DISPLAY, parent?: string) => openPanel(panel, asParent(parent)),
    [openPanel],
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
      safeShow(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON, `${DEFAULT_PARENT}:autoShow`);
    } else {
      safeHide(SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON, `${DEFAULT_PARENT}:autoHide`);
    }

    appliedRef.current = next;
  }, [addr, buyToken, safeShow, safeHide]);

  const onOpenInline = useCallback(() => {
    // Hide launcher (visibility-only), then open the panel (navigation/stack-aware as needed)
    safeHide(
      SP_COIN_DISPLAY.ADD_SPONSORSHIP_BUTTON,
      `${DEFAULT_PARENT}:onOpenInline:hideLauncher`,
    );

    safeOpen(
      SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL,
      `${DEFAULT_PARENT}:onOpenInline:openPanel`,
    );
  }, [safeOpen, safeHide]);

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
