'use client';

import { WalletAccount, InputState, FEED_TYPE } from '@/lib/structure/types';
import BaseModalDialog from '@/components/Dialogs/BaseModelDialog';
import AddressSelect from '@/components/Dialogs/AddressSelect';

type Props = {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onSelect: (walletAccount: WalletAccount) => void;
};

export default function RecipientSelectDialog({ showDialog, setShowDialog, onSelect }: Props) {
  return (
    <BaseModalDialog
      id="RecipientSelectDialog"
      showDialog={showDialog}
      setShowDialog={setShowDialog}
      title="Select a Recipient"
    >
      <AddressSelect<WalletAccount>
        feedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
        inputPlaceholder="Paste recipient wallet address"
        closeDialog={() => setShowDialog(false)}
        onSelect={(account, state) => {
          if (state === InputState.CLOSE_INPUT) onSelect(account);
        }}
      />
    </BaseModalDialog>
  );
}
