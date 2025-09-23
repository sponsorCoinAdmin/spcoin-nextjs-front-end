// File: components/Buttons/ManageSponsorsButton.tsx
'use client';

import React, { useState, useCallback } from 'react';
import styles from '@/styles/Exchange.module.css';
import { TokenContract } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import SponsorshipsConfigPanel from '../containers/SponsorshipsConfigPanel';

type Props = {
  tokenContract: TokenContract | undefined;
};

const ManageSponsorsButton = ({ tokenContract }: Props) => {
  const [showPanel, setShowDialog] = useState(false);
  const { isVisible, closePanel } = usePanelTree();

  // This button’s visibility is controlled by the SELL subtree toggle
  const showButton = isVisible(SP_COIN_DISPLAY.SPONSORSHIP_SELECT_CONFIG_BUTTON);

  const openDialog = useCallback(() => {
    // Hide the toggle node when opening the panel (mirrors AddSponsorshipButton behavior)
    closePanel(SP_COIN_DISPLAY.SPONSORSHIP_SELECT_CONFIG_BUTTON);
    setShowDialog(true);
  }, [closePanel]);

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
        // If you add an onClose prop to the panel, wire it here:
        // onClose={() => setShowDialog(false)}
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
