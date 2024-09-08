import { useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import { DISPLAY_STATE, TokenContract } from '@/lib/structure/types';
import { hideElement, showElement } from '@/lib/spCoin/guiControl';

type Props = {
  activeAccount: any,
  buyTokenContract: TokenContract,
  setDisplayState:(displayState:DISPLAY_STATE) => void,
}

const AddSponsorshipButton = ({activeAccount, buyTokenContract, setDisplayState} : Props) => {
  const [showComponent, setShowComponent ] = useState<boolean>(false)
  const openComponent = () => {
    showElement("recipientSelectDiv")
    hideElement("recipientConfigDiv")
  }

  try {
    return (
      <div id="addSponsorshipDiv" className={styles[`addSponsorshipDiv`]} onClick={() => openComponent()}>
        <div className={styles["centerTop"]} >Add</div>
        <div className={styles["centerBottom"]} >Sponsorship</div>
      </div>
    );
  } catch (err:any) {
    console.debug (`Buy Container Error:\n ${err.message}`)
  }
}

export default AddSponsorshipButton;
