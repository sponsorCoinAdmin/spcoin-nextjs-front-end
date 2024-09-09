import React, { useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import cog_png from '../../public/resources/images/miscellaneous/cog.png';
import Link from 'next/link'
import { AccountRecord } from '@/lib/structure/types';
import SponsorRateConfig from './SponsorRateConfig';
import { exchangeContext } from '@/lib/context';
import RecipientSelect from './RecipientSelect';
import { hideElement } from '@/lib/spCoin/guiControl';

type Props = {
  showContainer:boolean
}

const toggleConfig = () => {
  const el = document.getElementById('recipientConfigDiv');
  if (el != null) {
    el.style.display === 'block' ? 
      alert(`toggleConfig: block`): alert(`toggleConfig !block`)
  }
};

const RecipientContainer = ({showContainer} : Props) => {
  // alert("RecipientContainer:\n" + JSON.stringify(recipientAccount,null,2))
  // let urlParms:string = `/Recipient?address=${recipientAccount.address}`
  const [recipientAccount, setRecipientAccount] = useState<AccountRecord>(exchangeContext.recipientAccount);

  useEffect(() => {
    console.debug(`PRICE.useEffect[recipientAccount = ${recipientAccount}])`);
    exchangeContext.recipientAccount = recipientAccount;
  }, [recipientAccount]);

  return (
    <>
      <div id="recipientSelectDiv" className={styles["inputs"] + " " + styles["hidden"]}>
      <div id="recipient-id" className={styles.sponsorCoinContainer}/>
      {/* <div className={styles["lineDivider3"]}>
      -------------------------------------------------------------------
      </div> */}
         <div className={styles["yourRecipient"]}>
          You are sponsoring:
        </div>
        <Link href={`${recipientAccount.url}`} className={styles["recipientName"]}>
          {recipientAccount.name}
        </Link>
        <RecipientSelect recipientAccount={recipientAccount} callBackRecipientAccount={setRecipientAccount}/>
        <div>
          <Image src={cog_png} className={styles["cogImg"]} width={20} height={20} alt="Info Image"  
          onClick={() => toggleConfig()}/>
        </div>
        <div id="closeSponsorSelect" className={styles["closeSponsorSelect"]} onClick={() => hideElement('recipientSelectDiv')}>
          X
        </div>
      </div>
      <SponsorRateConfig />
    </>);
}

export default RecipientContainer;
