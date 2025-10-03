// File: components/Buttons/ManageSponsorsButton.tsx
'use client';

import React, { useCallback, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';
import { TokenContract } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

type Props = {
  tokenContract: TokenContract | undefined; // kept for API compatibility (unused here)
};

const ManageSponsorsButton = ({ tokenContract: _tokenContract }: Props) => {
  const { isVisible, openPanel, closePanel } = usePanelTree();
  const busyRef = useRef(false);

  // Launcher button visibility (button enum)
  const showButton = isVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);

  // Open the Manage Sponsorships overlay (rendered centrally by MainTradingPanel)
  const openDialog = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      // Hide the launcher button
      if (isVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON)) {
        closePanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_BUTTON);
      }
      // Show the centralized Manage panel
      if (!isVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL)) {
        openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
      }
    } finally {
      busyRef.current = false;
    }
  }, [isVisible, openPanel, closePanel]);

  // No local <ManageSponsorShipsPanel /> here anymore — MainTradingPanel owns the rendering.

  return showButton ? (
    <div
      id="manageSponsorshipsDiv"
      className={styles.manageSponsorshipsDiv}
      role="button"
      tabIndex={0}
      aria-label="Manage Sponsorships"
      onClick={openDialog}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDialog();
        }
      }}
    >
      <div className={styles.centerTop}>Manage</div>
      <div className={styles.centerBottom}>Sponsorships</div>
    </div>
  ) : null;
};

export default ManageSponsorsButton;
