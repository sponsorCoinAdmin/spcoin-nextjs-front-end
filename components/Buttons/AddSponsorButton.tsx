import { useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import { AccountRecord, TokenContract } from '@/lib/structure/types';
import { hideElement, showElement } from '@/lib/spCoin/guiControl';
import { exchangeContext } from '@/lib/context';
import RecipientSelect from '../containers/RecipientSelect';
import RecipientContainer from '../containers/RecipientContainer';

type Props = {
  activeAccount: any,
  buyTokenContract: TokenContract,
}

const AddSponsorshipButton = ({activeAccount, buyTokenContract} : Props) => {
  const [recipientAccount, setRecipientAccount] = useState<AccountRecord>(exchangeContext.recipientAccount);
  const [showComponent, setShowComponent ] = useState<boolean>(false)
  const openComponent = () => {
    showElement("RecipientSelect_ID")
    hideElement("addSponsorshipDiv_ID")
    exchangeContext.activeContainerId = "RecipientSelect_ID";
  }

  try {
    return (
      <>
        <div id="addSponsorshipDiv_ID" className={styles[`addSponsorshipDiv`]} onClick={() => openComponent()}>
          <div className={styles["centerTop"]} >Add</div>
          <div className={styles["centerBottom"]} >Sponsorship</div>
        </div>
        <RecipientContainer setRecipientCallBack={function (accountRecord: AccountRecord): void {
              throw new Error('Function not implemented.');
            } }/>
      </>
  );
  } catch (err:any) {
    console.debug (`Buy Container Error:\n ${err.message}`)
  }
}

export default AddSponsorshipButton;
