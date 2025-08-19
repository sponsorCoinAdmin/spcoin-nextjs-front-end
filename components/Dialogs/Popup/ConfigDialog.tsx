// File: components/Dialogs/Popup/ConfigDialog.tsx
'use client';

import { useEffect, useRef } from 'react';
import SlippageBpsRadioButtons from './SlippageBpsRadioButtons';

type Props = {
  showPanel: boolean;
};

export default function Dialog({ showPanel }: Props) {
  const dialogRef = useRef<null | HTMLDialogElement>(null);

  useEffect(() => {
    if (showPanel) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [showPanel]);

  const closePanel = () => {
    dialogRef.current?.close();
  };

  return (
    <dialog
      id="ConfigDialog"
      ref={dialogRef}
      // ⬇️ Replaced inline styles with Tailwind (arbitrary values allowed)
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
          onClick={closePanel}
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
