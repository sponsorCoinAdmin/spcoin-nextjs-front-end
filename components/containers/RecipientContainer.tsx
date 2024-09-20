import React, { useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import cog_png from '../../public/resources/images/miscellaneous/cog.png';
import Link from 'next/link'
import { AccountRecord } from '@/lib/structure/types';
import SponsorRateConfig from './SponsorRateConfig';
import { exchangeContext } from '@/lib/context';
import RecipientSelect from './RecipientSelect';
import { hideElement, showElement } from '@/lib/spCoin/guiControl';

type Props = {
  // accountRecord:AccountRecord;
  setRecipientCallBack: (accountRecord:AccountRecord) => void;
}

const toggleConfig = (element:string) => {
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display === 'block' ? 
      hideElement(element): showElement(element)
  }
};

const RecipientContainer = ({setRecipientCallBack} : Props) => {
  // const RecipientContainer = ({setRecipientCallBack} : Props) => {
    // alert("RecipientContainer:\n" + JSON.stringify(recipientAccount,null,2))
  // let urlParms:string = `/Recipient?address=${recipientAccount.address}`
  const [recipientAccount, setRecipientAccount] = useState<AccountRecord>(exchangeContext.recipientAccount);

  useEffect(() => {
    console.debug(`PRICE.useEffect[recipientAccount = ${recipientAccount}])`);
    exchangeContext.recipientAccount = recipientAccount;
  }, [recipientAccount]);

  const closeRecipientSelect = () => {
    showElement('AddSponsorshipButton_ID');
    hideElement('RecipientSelect_ID');
    hideElement('SponsorRateConfig_ID');
  }

  return (
    <>
    
      <div id="recipientContainerDiv_ID" className={styles["inputs"] + " " + styles["RecipientContainer"]}>
        <div className={styles["lineDivider"]}>
            -------------------------------------------------------------------
        </div>
        <div className={styles["yourRecipient"]}>
          You are sponsoring:
        </div>
        <Link href={`${recipientAccount.url}`} className={styles["recipientName"]}>
          {recipientAccount.name}
        </Link>
        <div className={styles["recipientSelect"]}>
          <RecipientSelect recipientAccount={recipientAccount} callBackRecipientAccount={setRecipientAccount}/>
        </div>
        <div>
          <Image src={cog_png} className={styles["cogImg"]} width={20} height={20} alt="Info Image"  
          onClick={() => toggleConfig('SponsorRateConfig_ID')}/>
        </div>
        <div id="clearSponsorSelect" className={styles["clearSponsorSelect"]} onClick={closeRecipientSelect}>
          X
        </div>
      </div>
      <SponsorRateConfig />
    </>);
}

export default RecipientContainer;
