'use client';

import { WalletAccount } from '@/lib/structure/types';
import RecipientSelect from '@/components/Dialogs/RecipientSelect';
import BaseModalDialog from "@/components/Dialogs/BaseModelDialog";

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
      <RecipientSelect closeDialog={() => setShowDialog(false)} onSelect={onSelect} />
    </BaseModalDialog>
  );
}
