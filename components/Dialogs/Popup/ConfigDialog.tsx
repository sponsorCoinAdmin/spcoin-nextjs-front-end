'use client';

import { useEffect, useRef } from 'react';
import SlippageBpsRadioButtons from './SlippageBpsRadioButtons';

// ✅ All styles defined in `popup`
const popup = {
  popupContainer: {
    position: 'absolute',
    top: '-210px',
    right: '-740px',
    color: 'white',
    backgroundColor: '#0E111B',
    border: 'solid #21273a',
    minHeight: '10px',
    borderRadius: '15px',
  } as React.CSSProperties,

  inneraddressSelectPanel: {
    backgroundColor: '#243056',
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    flexGrow: 1,
    scrollbarWidth: 'thin', // Firefox
    padding: '10px',
    color: '#5981F3',
    borderWidth: '0px',
    marginBottom: '5px',
    borderRadius: '22px',
  } as React.CSSProperties,
};

type Props = {
  showDialog: boolean;
};

export default function Dialog({ showDialog }: Props) {
  const dialogRef = useRef<null | HTMLDialogElement>(null);

  useEffect(() => {
    if (showDialog) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [showDialog]);

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  return (
    <dialog id="ConfigDialog" ref={dialogRef} style={popup.popupContainer}>
      <div className="flex flex-row justify-between mb-1 pt-0 px-3 text-white">
        <h1 className="text-md indent-39 mt-1 text-bg-txt-ltgry">Settings</h1>
        <div
          className="cursor-pointer rounded border-none w-5 text-xl text-bg-txt-ltgry"
          onClick={closeDialog}
        >
          X
        </div>
      </div>
      <div>
        <div style={popup.inneraddressSelectPanel}>
          <SlippageBpsRadioButtons />
        </div>
      </div>
    </dialog>
  );
}
