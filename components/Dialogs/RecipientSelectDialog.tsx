// File: components/Dialogs/RecipientSelectDialog.tsx

'use client';

import styles from '@/styles/Modal.module.css';
import { useEffect, useRef, useCallback } from 'react';
import RecipientSelect from '@/components/Dialogs/RecipientSelect';
import { WalletAccount } from '@/lib/structure/types';

const TITLE_NAME = 'Select a Recipient';

type Props = {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onClose: (walletAccount: WalletAccount) => void;
};

export default function RecipientSelectDialog({ showDialog, setShowDialog, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const closeDialog = useCallback(() => {
    setShowDialog(false);
    dialogRef.current?.close();
  }, [setShowDialog]);

  useEffect(() => {
    if (dialogRef.current) {
      if (showDialog) {
        dialogRef.current.showModal();
      } else {
        dialogRef.current.close();
      }
    }
  }, [showDialog]);

  return (
    <dialog id="RecipientSelectDialog" ref={dialogRef} className={styles.modalContainer}>
      <div className="relative h-8 px-3 mb-1 text-gray-600">
        <h1 className="absolute left-1/2 bottom-0 translate-x-[-50%] text-lg">{TITLE_NAME}</h1>
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border-none w-5 text-xl text-white"
          onClick={closeDialog}
        >
          X
        </div>
      </div>

      <div className={`${styles.modalBox} flex flex-col h-full max-h-[80vh] min-h-0`}>
        <RecipientSelect closeDialog={closeDialog} onSelect={onClose} />
      </div>
    </dialog>
  );
}
