import React, { useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import { openDialog, RecipientDialog, TokenSelectDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { AccountRecord, TokenContract } from '@/lib/structure/types';

type Props = {
  recipientAccount: AccountRecord
  callBackRecipientAccount: (accountRecord:AccountRecord) => void,
}

const RecipientSelect = ({recipientAccount, callBackRecipientAccount}:Props) => {
    const [showDialog, setShowDialog ] = useState<boolean>(false)
    const openDialog = () => {
      setShowDialog(true)
    }
    
    return (
        <>
            {/* <TokenSelectDialog showDialog={showDialog} setShowDialog={setShowDialog} altTokenContract={altTokenContract} callBackSetter={setDecimalAdjustedContract} /> */}
            <RecipientDialog showDialog={showDialog} callBackRecipientAccount={callBackRecipientAccount} />
            <div className={styles["recipientSelect"]}>
              <img alt={recipientAccount.name} className="h-9 w-9 mr-2 rounded-md" src={recipientAccount.img} onClick={() => alert("Recipient Data " + JSON.stringify(recipientAccount,null,2))}/>
              {recipientAccount.symbol} 
              <DownOutlined onClick={() => openDialog()}/>
            </div>
        </>
    );
}

export default RecipientSelect;


       {/* <div className={styles["recipientSelect"]}>
          <img alt={recipientAccount.name} className="h-9 w-9 mr-2 rounded-md" src={recipientAccount.img} onClick={() => alert("Recipient Data " + JSON.stringify(recipientAccount,null,2))}/>
          {recipientAccount.symbol} 
          <DownOutlined onClick={() => openDialog("#recipientDialog")}/>
        </div> */}
