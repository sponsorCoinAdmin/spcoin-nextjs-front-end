// File: components/containers/RecipientSelectDropDown.tsx

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { RecipientDialogWrapper } from '@/components/Dialogs/AssetSelectDialog';
import { WalletAccount, InputState } from '@/lib/structure/types';
import { ChevronDown } from 'lucide-react';
import { useSafeAvatarURL } from '@/lib/hooks/useSafeAvatarURL';

interface Props {
  recipientAccount: WalletAccount | undefined;
  callBackAccount: (walletAccount: WalletAccount) => void;
}

const RecipientSelectDropDown: React.FC<Props> = ({ recipientAccount, callBackAccount }) => {
  const [showDialog, setShowDialog] = useState(false);
  const hasErroredRef = useRef(false); // 🛑 Prevents infinite retry loops

  const openDialog = useCallback(() => setShowDialog(true), []);

  const handleRecipientSelect = useCallback(
    (wallet: WalletAccount) => {
      console.debug('✅ [RecipientSelectDropDown] Received wallet from dialog:', wallet);
      callBackAccount(wallet);
      hasErroredRef.current = false; // Reset error tracking on new selection
    },
    [callBackAccount]
  );

  const avatarSrc = useSafeAvatarURL(
    recipientAccount?.address,
    undefined,
    recipientAccount?.logoURL
  );

  const handleAvatarError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (!recipientAccount || hasErroredRef.current) return;

      console.warn(
        `[RecipientSelectDropDown] Missing avatar for ${recipientAccount.symbol} (${recipientAccount.logoURL})`
      );

      // Prevent retry loop
      hasErroredRef.current = true;
      // Swap to fallback (this may already be avatarSrc if useSafeAvatarURL returned fallback)
      event.currentTarget.src = '/assets/miscellaneous/badTokenAddressImage.png';
    },
    [recipientAccount]
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
