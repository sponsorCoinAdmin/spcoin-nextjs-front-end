import React, { useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import cog_png from '@/public/resources/images/miscellaneous/cog.png';
import Link from 'next/link'
import { AccountRecord, SP_COIN_DISPLAY } from '@/lib/structure/types';
import SponsorRateConfig from './SponsorRateConfig';
import { exchangeContext } from '@/lib/context';
import RecipientSelect from './RecipientSelect';
import { displaySpCoinContainers, toggleSponsorRateConfig } from '@/lib/spCoin/guiControl';

type Props = {
  // accountRecord:AccountRecord;
  setRecipientCallBack: (accountRecord:AccountRecord) => void;
}

const RecipientContainer = ({setRecipientCallBack}:Props) => {
  // const RecipientContainer = ({setRecipientCallBack}:Props) => {
  // alert("RecipientContainer:\n" + JSON.stringify(exchangeContext.recipientAccount,null,2))
  // let urlParms:string = `/Recipient?address=${recipientAccount?.address}`
  const [recipientAccount, setRecipientAccount] = useState<AccountRecord|undefined>(exchangeContext.recipientAccount);

  useEffect(() => {
    console.debug(`PRICE.useEffect[recipientAccount = ${recipientAccount}])`);
    exchangeContext.recipientAccount = recipientAccount;
  }, [recipientAccount]);

  const closeRecipientSelect = () => {
    displaySpCoinContainers(SP_COIN_DISPLAY.SELECT_BUTTON);
    setRecipientAccount(undefined);
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
        <Link href={`${recipientAccount?.url}`} className={styles["recipientName"]}>
          {recipientAccount?.name}
        </Link>
        <div className={styles["recipientSelect"]}>
          <RecipientSelect recipientAccount={recipientAccount} callBackRecipientAccount={setRecipientAccount}/>
        </div>
        <div>
          <Image src={cog_png} className={styles["cogImg"]} width={20} height={20} alt="Info Image"  
          onClick={() => toggleSponsorRateConfig('SponsorRateConfig_ID')}/>
        </div>
        <div id="clearSponsorSelect" className={styles["clearSponsorSelect"]} onClick={closeRecipientSelect}>
          X
        </div>
      </div>
      <SponsorRateConfig />
    </>
  );
}

export default RecipientContainer;
