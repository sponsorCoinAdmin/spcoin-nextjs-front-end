"use client";

import { useEffect, useRef } from "react";
import styles from "@/styles/Modal.module.css";

type ErrorType = {
  name: string;
  message: string;
  errorId?: number;
  stack?: string;
};

type Props = {
  errMsg: ErrorType;
  showDialog: boolean;
};

export default function Dialog({ showDialog, errMsg }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dialogRef.current) {
      showDialog ? dialogRef.current.showModal() : dialogRef.current.close();
    }
  }, [showDialog]);

  return (
    <dialog
      id="errorDialog"
      ref={dialogRef}
      className={styles.addressSelectPanel}
      aria-modal="true"
    >
      <div className="flex justify-between mb-1 pt-0 px-3 text-gray-600">
        <h1 className="text-sm indent-9 mt-1">{errMsg.name}</h1>
        <button
          className="cursor-pointer rounded border-none w-5 text-xl text-white"
          onClick={() => dialogRef.current?.close()}
        >
          X
        </button>
      </div>

      <div className={styles.modalBox}>
        <div className={styles.scrollDataListPanel}>
          <h1>{errMsg.name}</h1>
          <p>{errMsg.message}</p>
        </div>
      </div>
    </dialog>
  );
}
