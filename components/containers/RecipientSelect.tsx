import React, { useEffect, useState } from 'react';
import styles from '@/components/Dialogs/Resources/styles/Modal.module.css';
import { openDialog, RecipientDialog, TokenSelectDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { AccountRecord, TokenContract } from '@/lib/structure/types';
import Image from 'next/image'
import searchMagGlassGrey_png from '../../public/resources/images/SearchMagGlassGrey.png'


type Props = {
  recipientAccount: AccountRecord| undefined
  callBackRecipientAccount: (accountRecord:AccountRecord) => void,
}

const RecipientSelect = ({recipientAccount, callBackRecipientAccount}:Props) => {
  const [showDialog, setShowDialog ] = useState<boolean>(false)
  const openDialog = () => { setShowDialog(true) }
  
  return (
    recipientAccount ?
    <>
      <RecipientDialog showDialog={showDialog} setShowDialog={setShowDialog} callBackRecipientAccount={callBackRecipientAccount} />
      <img alt={recipientAccount.name} className="h-9 w-9 mr-2 rounded-md  cursor-pointer text-white" src={recipientAccount.img} onClick={() => alert("Recipient Data " + JSON.stringify(recipientAccount,null,2))}/>
      {recipientAccount.symbol}
      <DownOutlined onClick={() => openDialog()}/>
    </> :
    <>
      <RecipientDialog showDialog={showDialog} setShowDialog={setShowDialog} callBackRecipientAccount={callBackRecipientAccount} />
      {/* <Image src={searchMagGlassGrey_png} className={styles.searchImage} alt="Search Image Grey" />
      <img alt={"N/A"} className="h-9 w-9 mr-2 rounded-md  cursor-pointer text-white" src={"/resources/images/SearchMagGlassWhite.png"} onClick={() => alert("Recipient Data " + JSON.stringify(recipientAccount,null,2))}/> */}
      &nbsp; Select Recipient:
      <DownOutlined onClick={() => openDialog()}/>
    </>
  );
}

export default RecipientSelect;

{/* <div className={styles["recipientSelect"]}>
  <img alt={recipientAccount.name} className="h-9 w-9 mr-2 rounded-md" src={recipientAccount.img} onClick={() => alert("Recipient Data " + JSON.stringify(recipientAccount,null,2))}/>
  {recipientAccount.symbol} 
  <DownOutlined onClick={() => openDialog("#recipientDialog")}/>
</div> */}
