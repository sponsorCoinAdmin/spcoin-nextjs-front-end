// File: lib/components/dialogs/BaseModalDialog.tsx

'use client';

import { useCallback, useEffect, useRef } from 'react';
import styles from '@/styles/Modal.module.css';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT_DIALOGS === 'true';
const debugLog = createDebugLogger('BaseModalDialog', DEBUG_ENABLED, LOG_TIME);

interface BaseModalDialogProps {
  id: string;
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function BaseModalDialog({
  id,
  showDialog,
  setShowDialog,
  title,
  children,
}: BaseModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const closeDialog = useCallback(() => {
    debugLog.log('❌ closeDialog called');
    if (dialogRef.current?.open) {
      setShowDialog(false);
      dialogRef.current.close();
    }
  }, [setShowDialog]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (showDialog && !dialog.open) {
      debugLog.log(`🟢 Opening dialog: ${id}`);
      dialog.showModal();
    } else if (!showDialog && dialog.open) {
      debugLog.log(`🔴 Closing dialog: ${id}`);
      dialog.close();
    }
  }, [showDialog, id]);

  return (
    <dialog id={id} ref={dialogRef} className={styles.modalContainer} aria-labelledby={`${id}-title`}>
      <div className="relative h-8 px-3 mb-1 text-gray-600">
        <h1 id={`${id}-title`} className="absolute left-1/2 bottom-0 translate-x-[-50%] text-lg">
          {title}
        </h1>
        <button
          onClick={closeDialog}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border-none w-5 text-xl text-white"
          aria-label="Close"
        >
          X
        </button>
      </div>
      <div className={`${styles.modalBox} flex flex-col h-full max-h-[80vh] min-h-0`}>
        {children}
      </div>
    </dialog>
  );
}
