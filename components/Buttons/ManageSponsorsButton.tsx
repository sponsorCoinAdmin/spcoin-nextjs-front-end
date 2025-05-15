import styles from '@/styles/Exchange.module.css';
import { TokenContract } from '@/lib/structure/types';
import { openDialog } from '../Dialogs/Dialogs';
import ManageSponsorships from '../Dialogs/ManageSponsorships';
import { useState } from 'react';
import { useSpCoinDisplay } from '@/lib/context/contextHooks';

type Props = {
  tokenContract: TokenContract|undefined,
}

const ManageSponsorsButton = ({ tokenContract}:Props) => {
  const [showDialog, setShowDialog ] = useState<boolean>(false)
    const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();
  
  
  const openDialog2 = () => {
      setShowDialog(true)
      openDialog("#manageSponsorshipsDialog")
      openDialog("#recipientContainerDiv_ID")
  }

  const junkManageSponsorshipCallback = (tokenContract:TokenContract) => {
    return null;
  }

  try {
    return (
      <>
        <ManageSponsorships showDialog={showDialog} tokenContract={tokenContract} callBackSetter={junkManageSponsorshipCallback}  />
        <div id="manageSponsorshipsDiv" className={styles[`manageSponsorshipsDiv`]} onClick={() => openDialog2()}>
          <div className={styles["centerTop"]} >Manage</div>
          <div className={styles["centerBottom"]} >Sponsorships</div>
        </div>
      </>
    );
  } catch (err:any) {
    console.error (`Sell Container Error:\n ${err.message}`)
  }
}

export default ManageSponsorsButton;
