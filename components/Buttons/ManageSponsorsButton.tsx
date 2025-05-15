'use client';

import styles from '@/styles/Exchange.module.css';
import { TokenContract, SP_COIN_DISPLAY } from '@/lib/structure/types';
import ManageSponsorships from '../Dialogs/ManageSponsorships';
import { useState } from 'react';
import { useSpCoinDisplay } from '@/lib/context/contextHooks';

type Props = {
  tokenContract: TokenContract | undefined;
};

const ManageSponsorsButton = ({ tokenContract }: Props) => {
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [spCoinDisplay] = useSpCoinDisplay();

  // ✅ Only show if MANAGE_RECIPIENT_BUTTON is active
  if (spCoinDisplay !== SP_COIN_DISPLAY.MANAGE_RECIPIENT_BUTTON) return null;

  const openDialog = () => {
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
  };

  const noopCallback = (tokenContract: TokenContract) => {
    return null;
  };

  try {
    return (
      <>
        <ManageSponsorships
          showDialog={showDialog}
          tokenContract={tokenContract}
          callBackSetter={noopCallback}
        />
        <div
          className={styles.manageSponsorshipsDiv}
          onClick={openDialog}
        >
          <div className={styles.centerTop}>Manage</div>
          <div className={styles.centerBottom}>Sponsorships</div>
        </div>
      </>
    );
  } catch (err: any) {
    console.error(`ManageSponsorsButton Error:\n ${err.message}`);
    return null;
  }
};

export default ManageSponsorsButton;
