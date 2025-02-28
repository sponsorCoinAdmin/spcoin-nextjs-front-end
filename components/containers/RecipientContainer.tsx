import React, { useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import Link from 'next/link'
import { WalletAccount, SP_COIN_DISPLAY } from '@/lib/structure/types';
import SponsorRateConfig from './SponsorRateConfig';
import { exchangeContext } from '@/lib/context';
import RecipientSelect from './RecipientSelect';
import { displaySpCoinContainers, toggleSponsorRateConfig } from '@/lib/spCoin/guiControl';

type Props = {
  // walletAccount:WalletAccount;
  setRecipientCallBack: (walletAccount:WalletAccount|undefined) => void;
}

const RecipientContainer = () => {
  // const RecipientContainer = ({setRecipientCallBack}:Props) => {
  // alert("RecipientContainer:\n" + JSON.stringify(exchangeContext.recipientWallet,null,2))
  // let urlParms:string = `/Recipient?address=${recipientWallet?.address}`
  const [recipientWallet, setRecipientWallet] = useState<WalletAccount|undefined>(exchangeContext.recipientWallet);

  useEffect(() => {
    // console.debug(`PRICE.useEffect[recipientWallet = ${recipientWallet}])`);
    if (exchangeContext.recipientWallet !== recipientWallet)
      exchangeContext.recipientWallet = recipientWallet;
  }, [recipientWallet]);

  const closeRecipientSelect = () => {
    displaySpCoinContainers(SP_COIN_DISPLAY.SELECT_BUTTON);
    setRecipientWallet(undefined);
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
        <Link href={`${recipientWallet?.website}`} className={styles["recipientName"]}>
          {recipientWallet?.name}
        </Link>
        <div className={styles["recipientSelect"]}>
          <RecipientSelect recipientWallet={recipientWallet} callBackRecipientAccount={setRecipientWallet}/>
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
