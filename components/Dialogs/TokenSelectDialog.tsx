'use client';

import styles from "@/styles/Modal.module.css";
import { useEffect, useRef, useCallback } from "react";
import { useContainerType } from '@/lib/context/contextHooks';
import InputSelect from "@/components/Dialogs/InputSelect";
import { CONTAINER_TYPE, TokenContract, InputState } from "@/lib/structure/types";

export default function TokenSelectDialog({
  showDialog,
  setShowDialog,
  onClose,
}: {
  showDialog: boolean;
  setShowDialog: (bool: boolean) => void;
  onClose: (contract: TokenContract | undefined, inputState: InputState) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [containerType] = useContainerType();

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
    <dialog id="TokenSelectDialog" ref={dialogRef} className={styles.modalContainer}>
      <div className="relative h-8 px-3 mb-1 text-gray-600">
        <h1 className="absolute left-1/2 bottom-0 translate-x-[-50%] text-lg">
          {containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
            ? "Select a Token to Sell"
            : "Select a Token to Buy"}
        </h1>
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border-none w-5 text-xl text-white"
          onClick={closeDialog}
        >
          X
        </div>
      </div>

      <div className={`${styles.modalBox} flex flex-col h-full max-h-[80vh] min-h-0`}>
        <InputSelect closeDialog={closeDialog} onClose={onClose} />
      </div>
    </dialog>
  );
}
