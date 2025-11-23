// File: @/components/views/Config/ConfigPanel.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import SlippageBpsRadioButtons from './SlippageBpsRadioButtons';

type Props = {
  showPanel: boolean;
  onClose?: () => void;
};

export default function ConfigPanel({ showPanel, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    if (showPanel) {
      if (!dlg.open) dlg.showModal();
    } else {
      if (dlg.open) dlg.close();
    }
  }, [showPanel]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    const handleClose = () => onClose?.();
    const handleCancel = () => onClose?.();

    dlg.addEventListener('close', handleClose);
    dlg.addEventListener('cancel', handleCancel);
    return () => {
      dlg.removeEventListener('close', handleClose);
      dlg.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  const handleX = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const handleBackdropClick = useCallback<React.MouseEventHandler<HTMLDialogElement>>((e) => {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  }, []);

  return (
    <dialog
      id="ConfigPanel"
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="
        absolute top-[-210px] right-[-740px]
        text-white bg-[#0E111B]
        border border-[#21273a]
        min-h-[10px]
        rounded-[15px]
        backdrop:bg-black/40
      "
      aria-labelledby="config-panel-title"
    >
      {/* Header row with 6px top buffer */}
      <div className="flex flex-row items-center justify-between mt-1.5 mb-1 px-3 text-white">
        <h1
          id="config-panel-title"
          className="text-md text-bg-txt-ltgry m-0 leading-none"
        >
          Settings
        </h1>

        <button
          type="button"
          aria-label="Close"
          onClick={handleX}
          className="
            cursor-pointer w-5 text-xl leading-none
            bg-transparent
            border-0 outline-none ring-0 appearance-none
            focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0
            hover:bg-transparent active:bg-transparent
            text-bg-txt-ltgry self-center
          "
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
