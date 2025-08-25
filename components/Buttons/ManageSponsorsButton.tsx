// File: components/Buttons/ManageSponsorsButton.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import { TokenContract } from '@/lib/structure';
import ManageSponsorships from '@/components/containers/ManageSponsorships';
import { useState, useCallback } from 'react';

type Props = {
  tokenContract: TokenContract | undefined;
};

const ManageSponsorsButton = ({ tokenContract }: Props) => {
  const [showPanel, setShowDialog] = useState(false);

  const openDialog = useCallback(() => setShowDialog(true), []);

  // Placeholder until upstream logic consumes this callback
  const junkManageSponsorshipCallback = useCallback((tc: TokenContract) => {
    return null;
  }, []);

  return (
    <>
      <ManageSponsorships
        showPanel={showPanel}
        tokenContract={tokenContract}
        callBackSetter={junkManageSponsorshipCallback}
        // If your dialog supports onClose, wire it here to allow closing
        // onClose={() => setShowDialog(false)}
      />

      <div
        id="manageSponsorshipsDiv"
        className={styles.manageSponsorshipsDiv}
        onClick={openDialog}
      >
        <div className={styles.centerTop}>Manage</div>
        <div className={styles.centerBottom}>Sponsorships</div>
      </div>
    </>
  );
};

export default ManageSponsorsButton;
