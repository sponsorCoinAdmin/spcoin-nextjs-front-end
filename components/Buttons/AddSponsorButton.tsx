import { useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import { TokenContract } from '@/lib/structure/types';
import { hideElement, showElement } from '@/lib/spCoin/guiControl';

type Props = {
  activeAccount: any,
  buyTokenContract: TokenContract,
}

const AddSponsorshipButton = ({activeAccount, buyTokenContract} : Props) => {
  const [showComponent, setShowComponent ] = useState<boolean>(false)
  const openComponent = () => {
    showElement("RecipientSelect_ID")
    hideElement("SwapContainer_ID")
  }

  try {
    return (
      <div id="addSponsorshipDiv_ID" className={styles[`addSponsorshipDiv`]} onClick={() => openComponent()}>
        <div className={styles["centerTop"]} >Add</div>
        <div className={styles["centerBottom"]} >Sponsorship</div>
      </div>
    );
  } catch (err:any) {
    console.debug (`Buy Container Error:\n ${err.message}`)
  }
}

export default AddSponsorshipButton;
