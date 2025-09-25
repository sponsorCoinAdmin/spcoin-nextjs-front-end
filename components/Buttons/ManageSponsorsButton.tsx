// File: components/Buttons/ManageSponsorsButton.tsx
'use client';

import React, { useCallback } from 'react';
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

  // The entry-point button visibility is controlled by the SELL subtree toggle
  const showButton = isVisible(SP_COIN_DISPLAY.SPONSORSHIP_SELECT_CONFIG_BUTTON);

  // Whether the SponsorshipsConfigPanel should be visible (panel-tree driven)
  const showPanel = isVisible(SP_COIN_DISPLAY.SPONSORSHIPS_CONFIG_PANEL);

  const openDialog = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.SPONSORSHIPS_CONFIG_PANEL);
  }, [closePanel, openPanel]);

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
        // If the panel supports an onClose prop, wire it to close via the panel tree:
        // onClose={() => closePanel(SP_COIN_DISPLAY.SPONSORSHIPS_CONFIG_PANEL)}
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
