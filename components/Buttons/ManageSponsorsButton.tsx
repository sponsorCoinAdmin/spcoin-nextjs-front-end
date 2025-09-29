// File: components/Buttons/ManageSponsorsButton.tsx
'use client';

import React, { useCallback, useRef } from 'react';
import styles from '@/styles/Exchange.module.css';
import { TokenContract } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import SponsorshipsConfigPanel from '../containers/SponsorshipsConfigPanel';

type Props = {
  tokenContract: TokenContract | undefined;
};

const ManageSponsorsButton = ({ tokenContract }: Props) => {
  const { isVisible, openPanel, closePanel } = usePanelTree();
  const busyRef = useRef(false);

  // Launcher button visibility (button enum)
  const showButton = isVisible(SP_COIN_DISPLAY.SPONSORSHIP_SELECT_CONFIG_BUTTON);

  // Sponsorship configuration panel visibility (real panel enum)
  const showPanel = isVisible(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL);

  const openDialog = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      // Hide the launcher button
      if (isVisible(SP_COIN_DISPLAY.SPONSORSHIP_SELECT_CONFIG_BUTTON)) {
        closePanel(SP_COIN_DISPLAY.SPONSORSHIP_SELECT_CONFIG_BUTTON);
      }
      // Show the sponsorship configuration panel
      if (!isVisible(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL)) {
        openPanel(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL);
      }
    } finally {
      busyRef.current = false;
    }
  }, [isVisible, openPanel, closePanel]);

  // Placeholder until upstream logic consumes this callback
  const junkManageSponsorshipCallback = useCallback((tc: TokenContract) => {
    return null;
  }, []);

  return (
    <>
      <SponsorshipsConfigPanel
        showPanel={showPanel}
        tokenContract={tokenContract}
        callBackSetter={junkManageSponsorshipCallback}
        // If/when the panel exposes onClose, wire it like this:
        // onClose={() => {
        //   closePanel(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL);
        //   openPanel(SP_COIN_DISPLAY.SPONSORSHIP_SELECT_CONFIG_BUTTON);
        // }}
      />

      {showButton ? (
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
      ) : null}
    </>
  );
};

export default ManageSponsorsButton;
