import React, { useEffect, useState } from 'react';
import { RecipientDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { WalletAccount } from '@/lib/structure/types';
import { defaultMissingImage, getWalletAvatar } from '@/lib/network/utils';
import { stringifyBigInt } from '@/lib/spCoin/utils';

type Props = {
  recipientWallet: WalletAccount| undefined
  callBackRecipientAccount: (walletAccount: WalletAccount) => void,
}

const setMissingAvatar = (event: { currentTarget: { src: string; }; }, walletAccount: WalletAccount) => {
  // ToDo Set Timer to ignore fetch if last call
  event.currentTarget.src = defaultMissingImage;
  walletAccount.avatar = `***ERROR: MISSING AVATAR FILE*** -> ${walletAccount.avatar}`
}

const RecipientSelect = ({recipientWallet, callBackRecipientAccount}:Props) => {
  const [showDialog, setShowDialog ] = useState<boolean>(false)

  // useEffect(() => {
  //   alert(`recipientWallet = ${stringifyBigInt(recipientWallet)}`)  
  // }, [recipientWallet]);

  const openDialog = () => { setShowDialog(true) }
  return (
    recipientWallet ?
    <>
      <RecipientDialog showDialog={showDialog} setShowDialog={setShowDialog} callBackRecipientAccount={callBackRecipientAccount} />
      <img 
        alt={recipientWallet.name}
        className="h-9 w-9 mr-2 rounded-md  cursor-pointer text-white"
        src={recipientWallet.avatar}
        onClick={() => alert("Recipient Data " + JSON.stringify(recipientWallet,null,2))}
        onError={(event) => setMissingAvatar(event, recipientWallet)}/>
      {recipientWallet.symbol}
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
