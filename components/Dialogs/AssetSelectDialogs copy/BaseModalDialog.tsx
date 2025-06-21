'use client';

import { useCallback, useEffect, useRef } from 'react';
import styles from '@/styles/Modal.module.css';
import { createDebugLogger } from '@/lib/utils';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT_DIALOGS === 'true';
const debugLog = createDebugLogger('apiResponse', DEBUG_ENABLED, LOG_TIME);

export function BaseModalDialog({
  id,
  showDialog,
  setShowDialog,
  title,
  children,
}: {
  id: string;
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const closeDialog = useCallback(() => {
    debugLog.log('❌ [BaseModalDialog] closeDialog called');
    setShowDialog(false);
    dialogRef.current?.close();
  }, [setShowDialog]);

  useEffect(() => {
    if (dialogRef.current) {
      if (showDialog) {
        debugLog.log(`🟢 [BaseModalDialog] Opening dialog: ${id}`);
        dialogRef.current.showModal();
      } else {
        debugLog.log(`🔴 [BaseModalDialog] Closing dialog: ${id}`);
        dialogRef.current.close();
      }
    }
  }, [showDialog, id]);

  return (
    <dialog id={id} ref={dialogRef} className={styles.modalContainer}>
      <div className="relative h-8 px-3 mb-1 text-gray-600">
        <h1 className="absolute left-1/2 bottom-0 translate-x-[-50%] text-lg">{title}</h1>
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border-none w-5 text-xl text-white"
          onClick={closeDialog}
        >
          X
        </div>
      </div>
      <div className={`${styles.modalBox} flex flex-col h-full max-h-[80vh] min-h-0`}>
        {children}
      </div>
    </dialog>
  );
}
