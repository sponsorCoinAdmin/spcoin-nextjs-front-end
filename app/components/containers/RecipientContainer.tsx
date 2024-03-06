import React from 'react';
import styles from '../../styles/Exchange.module.css';
import { openDialog } from '../Dialogs/Dialogs';
import { hideSponsorRecipientConfig, toggleElement } from '@/app/lib/spCoin/guiControl';
import Image from 'next/image';
import { DownOutlined } from "@ant-design/icons";
import cog_png from '../../../public/resources/images/miscellaneous/cog.png';

type Props = {
  recipientElement: any, 
}

const RecipientContainer = ({recipientElement} : Props) => {
  return (
    <div id="recipientSelectDiv" className={styles["inputs"]}>
      <div id="recipient-id" className={styles.sponsorCoinContainer}/>
      <div className={styles["yourRecipient"]}>
        You are sponsoring:
      </div>
      <div className={styles["recipientName"]}>
        {recipientElement.name}
      </div>
      <div className={styles["recipientSelect"]}>
        <img alt={recipientElement.name} className="h-9 w-9 mr-2 rounded-md" src={recipientElement.img} />
        {recipientElement.symbol} 
        <DownOutlined onClick={() => openDialog("#recipientDialog")}/>
      </div>
      {/* <div className={styles["recipientPosition"]}> <AssetSelect tokenElement={recipientElement} id={"#recipientDialog"}></AssetSelect></div> */}
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
