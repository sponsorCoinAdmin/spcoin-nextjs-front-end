import styles from '@/styles/Exchange.module.css';
import { WalletAccount, SP_COIN_DISPLAY, TokenContract } from '@/lib/structure/types';
import { displaySpCoinContainers } from '@/lib/spCoin/guiControl';
import RecipientContainer from '../containers/RecipientContainer';

type Props = {
  tokenContract: TokenContract|undefined,
}

const AddSponsorshipButton = ({tokenContract}:Props) => {
  const openComponent = () => {
    // console.debug("AddSponsorshipButton:SHOW RecipientSelect_ID")
    displaySpCoinContainers(SP_COIN_DISPLAY.RECIPIENT_CONTAINER);
    // showElement("RecipientSelect_ID")
    // hideElement("AddSponsorshipButton_ID")
  }

  try {
    return (
      <>
        <div id="AddSponsorshipButton_ID" className={styles[`addSponsorshipDiv`]} onClick={() => openComponent()}>
          <div className={styles["centerTop"]} >Add</div>
          <div className={styles["centerBottom"]} >Sponsorship</div>
        </div>
        <div id="RecipientSelect_ID" className={styles[`hidden`]}>
          <RecipientContainer />
        </div>
      </>
  );
  } catch (err:any) {
    console.error (`Buy Container Error:\n ${err.message}`)
  }
}

export default AddSponsorshipButton;
