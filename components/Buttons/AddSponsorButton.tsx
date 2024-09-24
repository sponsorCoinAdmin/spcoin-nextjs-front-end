import styles from '@/styles/Exchange.module.css';
import { AccountRecord, SP_COIN_DISPLAY, TokenContract } from '@/lib/structure/types';
import { displaySpCoinContainers, hideElement, showElement } from '@/lib/spCoin/guiControl';
import { exchangeContext } from '@/lib/context';
import RecipientContainer from '../containers/RecipientContainer';

type Props = {
  activeAccount: any,
  buyTokenContract: TokenContract|undefined,
}

const AddSponsorshipButton = ({activeAccount, buyTokenContract} : Props) => {
  const openComponent = () => {
    console.log("AddSponsorButton:SHOW RecipientSelect_ID")
    displaySpCoinContainers(SP_COIN_DISPLAY.RECIPIENT_CONTAINER);
    // showElement("RecipientSelect_ID")
    // hideElement("AddSponsorshipButton_ID")
    exchangeContext.activeContainerId = "RecipientSelect_ID";
  }

  try {
    return (
      <>
        <div id="AddSponsorshipButton_ID" className={styles[`addSponsorshipDiv`]} onClick={() => openComponent()}>
          <div className={styles["centerTop"]} >Add</div>
          <div className={styles["centerBottom"]} >Sponsorship</div>
        </div>
        <div id="RecipientSelect_ID" className={styles[`hidden`]}>
        <RecipientContainer setRecipientCallBack={function (accountRecord: AccountRecord): void {
            throw new Error('Function not implemented.'); } }/>
        </div>
      </>
  );
  } catch (err:any) {
    console.debug (`Buy Container Error:\n ${err.message}`)
  }
}

export default AddSponsorshipButton;
