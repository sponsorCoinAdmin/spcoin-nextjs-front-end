import React, { useState, useCallback } from 'react';
import { RecipientDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { WalletAccount } from '@/lib/structure/types';
import { defaultMissingImage } from '@/lib/network/utils';

type Props = {
  recipientWallet: WalletAccount | undefined;
  callBackRecipientAccount: (walletAccount: WalletAccount) => void;
};

const WalletSelect: React.FC<Props> = ({ recipientWallet, callBackRecipientAccount }) => {
  const [showDialog, setShowDialog] = useState(false);

  const openDialog = useCallback(() => setShowDialog(true), []);

  const handleAvatarError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (recipientWallet) {
        event.currentTarget.src = defaultMissingImage;
        recipientWallet.avatar = `***ERROR: MISSING AVATAR FILE*** -> ${recipientWallet.avatar}`;
      }
    },
    [recipientWallet]
  );

  return (
    <>
      <RecipientDialog showDialog={showDialog} setShowDialog={setShowDialog} callBackRecipientAccount={callBackRecipientAccount} />
      {recipientWallet ? (
        <>
          <img
            alt={recipientWallet.name}
            className="h-9 w-9 mr-2 rounded-md cursor-pointer"
            src={recipientWallet.avatar}
            onClick={() => alert(`Recipient Data: ${JSON.stringify(recipientWallet, null, 2)}`)}
            onError={handleAvatarError}
          />
          {recipientWallet.symbol}
        </>
      ) : (
        <> &nbsp; Select Recipient: </>
      )}
      <DownOutlined onClick={openDialog} />
    </>
  );
};

export default WalletSelect;
