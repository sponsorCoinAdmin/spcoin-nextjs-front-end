import React, { useState, useCallback } from 'react';
import { RecipientDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { WalletAccount } from '@/lib/structure/types';
import { defaultMissingImage } from '@/lib/network/utils';

type Props = {
  recipientAccount: WalletAccount | undefined;
  callBackAccount: (walletAccount: WalletAccount) => void;
};

const WalletSelect: React.FC<Props> = ({ recipientAccount, callBackAccount }) => {
  const [showDialog, setShowDialog] = useState(false);

  const openDialog = useCallback(() => setShowDialog(true), []);

  const handleAvatarError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (recipientAccount) {
        event.currentTarget.src = defaultMissingImage;
        console.warn(`[AccountSelectDropDown] Missing avatar for ${recipientAccount.symbol} (${recipientAccount.avatar})`);
      }
    },
    [recipientAccount]
  );

  return (
    <>
      <RecipientDialog showDialog={showDialog} setShowDialog={setShowDialog} callBackAccount={callBackAccount} />
      {recipientAccount ? (
        <>
          <img
            alt={recipientAccount.name}
            className="h-9 w-9 mr-2 rounded-md cursor-pointer"
            src={recipientAccount.avatar}
            onClick={() => alert(`Recipient Data: ${JSON.stringify(recipientAccount, null, 2)}`)}
            onError={handleAvatarError}
          />
          {recipientAccount.symbol}
        </>
      ) : (
        <> &nbsp; Select Recipient: </>
      )}
      <DownOutlined onClick={openDialog} />
    </>
  );
};

export default WalletSelect;
