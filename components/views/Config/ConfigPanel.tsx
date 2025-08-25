'use client';

import { useEffect, useRef } from 'react';
import SlippageBpsRadioButtons from './SlippageBpsRadioButtons';

type Props = {
  showPanel: boolean;
  /** Optional: notify parent when the dialog closes (X, Esc, or programmatically) */
  onClose?: () => void;
};

export default function ConfigPanel({ showPanel, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Open/close imperatively when prop changes
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    if (showPanel) {
      if (!dlg.open) dlg.showModal();
    } else {
      if (dlg.open) dlg.close();
    }
  }, [showPanel]);

  // Bridge native <dialog> close event → onClose()
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    const handleClose = () => onClose?.();
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose]);

  const handleX = () => {
    // Calling close() will trigger the 'close' event, which invokes onClose (if provided)
    dialogRef.current?.close();
  };

  return (
    <dialog
      id="ConfigPanel"
      ref={dialogRef}
      className="
        absolute top-[-210px] right-[-740px]
        text-white bg-[#0E111B]
        border border-[#21273a]
        min-h-[10px]
        rounded-[15px]
      "
    >
      <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-white">
        <h1 className="text-md indent-39 mt-1 text-bg-txt-ltgry">Settings</h1>
        <button
          type="button"
          aria-label="Close"
          onClick={handleX}
          className="cursor-pointer rounded border-none w-5 text-xl text-bg-txt-ltgry"
        >
          X
        </button>
      </div>

      <div>
        <div
          className="
            bg-[#243056]
            w-full h-full
            overflow-y-auto
            flex-grow
            p-[10px]
            text-[#5981F3]
            border-0
            mb-[5px]
            rounded-[22px]
          "
        >
          <SlippageBpsRadioButtons />
        </div>
      </div>
    </dialog>
  );
}
