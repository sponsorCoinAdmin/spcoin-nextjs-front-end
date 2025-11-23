// File: @/components/Buttons/ManageSponsorsButton.tsx
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

  // ⚙️ Parent-tag rule: when not provided explicitly, use Module:Method(params)
  const safeOpen = useCallback(
    (panel: SP_COIN_DISPLAY, parent?: string) => {
      const parentTag = parent ?? `ManageSponsorsButton:safeOpen(${panel})`;
      openPanel(panel, parentTag);
    },
    [openPanel]
  );

  const safeClose = useCallback(
    (panel: SP_COIN_DISPLAY, parent?: string) => {
      const parentTag = parent ?? `ManageSponsorsButton:safeClose(${panel})`;
      closePanel(panel, parentTag);
    },
    [closePanel]
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
    safeClose(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON,
      'ManageSponsorsButton:onOpenManage(closeLauncher)'
    );
    safeOpen(
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      'ManageSponsorsButton:onOpenManage(openPanel)'
    );
  }, [safeOpen, safeClose]);

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
