import React from 'react';
import styles from '../../styles/Exchange.module.css';
import { openDialog } from '../Dialogs/Dialogs';
import { hideSponsorRecipientConfig, toggleElement } from '@/app/lib/spCoin/guiControl';
import Image from 'next/image';
import { DownOutlined } from "@ant-design/icons";
import cog_png from '../../../public/resources/images/miscellaneous/cog.png';
import Link from 'next/link'
import Recipient from '@/app/(menuPages)/Recipient/page';

type Props = {
  recipientWallet: any, 
}
// address: any;
// symbol: string;
// name: string;
// img: string;
// url: string;

const RecipientContainer = ({recipientWallet} : Props) => {
  // alert("RecipientContainer:\n" + JSON.stringify(recipientWallet,null,2))
  // let urlParms:string = `/Recipient?address=${recipientWallet.address}`
  let urlParms:string = `/Recipient/${recipientWallet.address}`
  urlParms += `?name=${recipientWallet.name}`
  urlParms += `&symbol=${recipientWallet.symbol}`
  urlParms += `&address=${recipientWallet.address}`
  urlParms += `&img=${recipientWallet.img}`
  urlParms += `&url=${recipientWallet.url}`

  console.debug (`calling urlParms: ${urlParms}`)
  return (
    <div id="recipientSelectDiv" className={styles["inputs"]}>
      <div id="recipient-id" className={styles.sponsorCoinContainer}/>
      <div className={styles["yourRecipient"]}>
        You are sponsoring:
      </div>
      {/* <Link href={`/Recipient?address=${recipientWallet.address}`} className={styles["recipientName"]}> */}
      <Link href={`${urlParms}`} className={styles["recipientName"]}>
        {recipientWallet.name}
      </Link>
      <div className={styles["recipientSelect"]}>
        <img alt={recipientWallet.name} className="h-9 w-9 mr-2 rounded-md" src={recipientWallet.img} />
        {recipientWallet.symbol} 
        <DownOutlined onClick={() => openDialog("#recipientDialog")}/>
      </div>
      {/* <div className={styles["recipientPosition"]}> <AssetSelect tokenElement={recipientWallet} id={"#recipientDialog"}></AssetSelect></div> */}
      <div>
        <Image src={cog_png} className={styles["cogImg"]} width={20} height={20} alt="Info Image"  onClick={() => toggleElement("recipientConfigDiv")}/>
      </div>
      <div id="closeSponsorSelect" className={styles["closeSponsorSelect"]} onClick={() => hideSponsorRecipientConfig()}>
        X
      </div>
    </div>
  );
}

export default RecipientContainer;
