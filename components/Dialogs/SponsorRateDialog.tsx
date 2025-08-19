// File: components/Dialogs/SponsorRateDialog.tsx
'use client';

import styles from '@/styles/Modal.module.css';
import { useEffect, useRef } from 'react';

type ErrorType = {
  name: string;
  message: string;
  errorId?: number;
  stack?: string;
};

type Props = {
  errMsg: ErrorType;
  showPanel: boolean;
};

export default function SponsorRateDialog({ showPanel, errMsg }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (dialogRef.current) {
      showPanel ? dialogRef.current.showModal() : dialogRef.current.close();
    }
  }, [showPanel]);

  const closePanel = () => {
    dialogRef.current?.close();
  };

  return (
    <dialog
      id="sponsorRateDialog"
      ref={dialogRef}
      className={styles.baseSelectPanel}
      aria-modal="true"
    >
      <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-gray-600">
        <h1 className="text-sm indent-9 mt-1">{errMsg.name}</h1>
        <div
          className="cursor-pointer rounded border-none w-5 text-xl text-white"
          onClick={closePanel}
        >
          X
        </div>
      </div>

      <div className={styles.modalBox}>
        <div className={styles.scrollDataListPanel}>
          <h1>{errMsg.name}</h1>
          <div>{errMsg.message}</div>
        </div>
      </div>
    </dialog>
  );
}
