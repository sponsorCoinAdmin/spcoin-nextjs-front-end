// File: components/Dialogs/ErrorDialog.tsx
'use client';

import { ErrorMessage } from '@/lib/structure';
import styles from '@/styles/Modal.module.css';
import { useEffect, useRef } from 'react';

type Props = {
  showContainer: boolean;
  closeDialog: () => void;
  message?: ErrorMessage;
};

export default function ErrorDialog({ showContainer, closeDialog, message }: Props) {
  const dialogRef = useRef<null | HTMLDialogElement>(null);

  useEffect(() => {
    showContainer ? dialogRef.current?.showModal() : dialogRef.current?.close();
  }, [showContainer]);

  return (
    <dialog id="errorDialog" ref={dialogRef} className={styles.modalContainer}>
      <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
        <h1 className="text-sm indent-9 mt-1">{message?.source}</h1>
        <div
          className="cursor-pointer rounded border-none w-5 text-xl text-white"
          onClick={closeDialog}
        >
          X
        </div>
      </div>

      <div className={styles.modalBox}>
        <div className={styles.modalScrollBar}>
          <h1>SourceCode: {message?.source}</h1>
          <div>Error Code: {message?.errCode}</div>
          <div>Message: {message?.msg}</div>
        </div>
      </div>
    </dialog>
  );
}
