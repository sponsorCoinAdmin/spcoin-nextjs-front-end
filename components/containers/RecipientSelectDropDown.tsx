// File: components/containers/RecipientSelectDropDown.tsx

'use client';

import React, { useState, useCallback } from 'react';
import { RecipientDialogWrapper } from '@/components/Dialogs/AddressSelectDialog';
import { WalletAccount, InputState } from '@/lib/structure/types';
import { ChevronDown } from 'lucide-react';
import { useSafeAvatarURL } from '@/lib/hooks/useSafeAvatarURL';

interface Props {
  recipientAccount: WalletAccount | undefined;
  callBackAccount: (walletAccount: WalletAccount) => void;
}

const RecipientSelectDropDown: React.FC<Props> = ({ recipientAccount, callBackAccount }) => {
  const [showDialog, setShowDialog] = useState(false);

  const openDialog = useCallback(() => setShowDialog(true), []);

  const handleRecipientSelect = useCallback(
    (wallet: WalletAccount) => {
      console.debug('✅ [RecipientSelectDropDown] Received wallet from dialog:', wallet);
      callBackAccount(wallet);
    },
    [callBackAccount]
  );

  const avatarSrc = useSafeAvatarURL(
    recipientAccount?.address,
    undefined,
    recipientAccount?.avatar
  );

  const handleAvatarError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (recipientAccount) {
        event.currentTarget.src = avatarSrc;
        console.warn(
          `[RecipientSelectDropDown] Missing avatar for ${recipientAccount.symbol} (${recipientAccount.avatar})`
        );
      }
    },
    [recipientAccount, avatarSrc]
  );

  return (
    <>
      <RecipientDialogWrapper
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        onSelect={(wallet, state) => {
          console.debug('🎯 [RecipientDialogWrapper -> DropDown] onSelect triggered', { wallet, state });
          if (state === InputState.CLOSE_INPUT) {
            handleRecipientSelect(wallet);
            setShowDialog(false);
          }
        }}
      />
      {recipientAccount ? (
        <>
          <img
            alt={recipientAccount.name}
            className="h-9 w-9 mr-2 rounded-md cursor-pointer"
            src={avatarSrc}
            onClick={() => alert(`Recipient Data: ${JSON.stringify(recipientAccount, null, 2)}`)}
            onError={handleAvatarError}
          />
          {recipientAccount.symbol}
        </>
      ) : (
        <> &nbsp; Select Recipient: </>
      )}
      <ChevronDown size={16} onClick={openDialog} style={{ cursor: 'pointer', marginLeft: '0.5rem' }} />
    </>
  );
};

export default RecipientSelectDropDown;
