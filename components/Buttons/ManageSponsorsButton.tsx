import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY, TokenContract } from '@/lib/structure';
import ManageSponsorships from '@/components/Dialogs/ManageSponsorships';
import { useState, useEffect } from 'react';

type Props = {
  tokenContract: TokenContract | undefined,
};

const ManageSponsorsButton = ({ tokenContract }: Props) => {
  const [showDialog, setShowDialog] = useState<boolean>(false);

  const openDialog2 = () => {
    setShowDialog(true);
  };

  const junkManageSponsorshipCallback = (tokenContract: TokenContract) => {
    return null;
  };

  return (
    <>
      <ManageSponsorships
        showDialog={showDialog}
        tokenContract={tokenContract}
        callBackSetter={junkManageSponsorshipCallback}
      />
      <div
        id="manageSponsorshipsDiv"
        className={styles.manageSponsorshipsDiv}
        onClick={openDialog2}
      >
        <div className={styles.centerTop}>Manage</div>
        <div className={styles.centerBottom}>Sponsorships</div>
      </div>
    </>
  );
};

export default ManageSponsorsButton;
