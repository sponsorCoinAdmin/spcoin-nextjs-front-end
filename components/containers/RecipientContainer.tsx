import React, { useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import { AgentDialog, openDialog, RecipientDialog } from '../Dialogs/Dialogs';
import Image from 'next/image';
import { DownOutlined } from "@ant-design/icons";
import cog_png from '../../public/resources/images/miscellaneous/cog.png';
import Link from 'next/link'
import { AccountRecord } from '@/lib/structure/types';
import SponsorRateConfig from './SponsorRateConfig';
import { exchangeContext } from '@/lib/context';
import { showElement, hideElement } from '@/lib/spCoin/guiControl';

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
  const [recipientAccount, setRecipientElement] = useState<AccountRecord>(exchangeContext.recipientAccount);
  const [agentAccount, setAgentElement] = useState(exchangeContext.agentAccount);
  const [showComponent, setShowComponent ] = useState<boolean>(false)

  useEffect(() => {
    console.debug(`PRICE.useEffect[recipientAccount = ${recipientAccount}])`);
    exchangeContext.recipientAccount = recipientAccount;
  }, [recipientAccount]);

  let urlParms:string = `/Recipient/${recipientAccount.address}`
  urlParms += `?name=${recipientAccount.name}`
  urlParms += `&symbol=${recipientAccount.symbol}`
  urlParms += `&address=${recipientAccount.address}`
  urlParms += `&img=${recipientAccount.img}`
  urlParms += `&url=${recipientAccount.url}`

  // console.debug (`calling urlParms: ${urlParms}`)
  return (
    <>
      <RecipientDialog  showDialog={false} agentAccount={agentAccount} setRecipientElement={setRecipientElement} />
      <AgentDialog  showDialog={false} recipientAccount={recipientAccount} callBackSetter={setAgentElement} />
      <div id="recipientSelectDiv" className={styles["inputs"] + " " + styles["hidden"]}>
      <div id="recipient-id" className={styles.sponsorCoinContainer}/>
      {/* <div className={styles["lineDivider3"]}>
      -------------------------------------------------------------------
      </div> */}
         <div className={styles["yourRecipient"]}>
          You are sponsoring:
        </div>
        <Link href={`${urlParms}`} className={styles["recipientName"]}>
          {recipientAccount.name}
        </Link>
        <div className={styles["recipientSelect"]}>
          <img alt={recipientAccount.name} className="h-9 w-9 mr-2 rounded-md" src={recipientAccount.img} onClick={() => alert("Recipient Data " + JSON.stringify(recipientAccount,null,2))}/>
          {recipientAccount.symbol} 
          <DownOutlined onClick={() => openDialog("#recipientDialog")}/>
        </div>
        <div>
          <Image src={cog_png} className={styles["cogImg"]} width={20} height={20} alt="Info Image"  
          onClick={() => toggleConfig()}/>
        </div>
        <div id="closeSponsorSelect" className={styles["closeSponsorSelect"]} onClick={() => alert("AAAAAAAAAAAAAAAAAAA")}>
          X
        </div>
      </div>
      <SponsorRateConfig />
    </>  );
}

export default RecipientContainer;
