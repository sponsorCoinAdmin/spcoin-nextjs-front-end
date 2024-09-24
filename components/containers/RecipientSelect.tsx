import React, { useEffect, useState } from 'react';
import { openDialog, RecipientDialog, TokenSelectDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { AccountRecord, TokenContract } from '@/lib/structure/types';

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
      &nbsp; Select Recipient:
      <DownOutlined onClick={() => openDialog()}/>
    </>
  );
}

export default RecipientSelect;
