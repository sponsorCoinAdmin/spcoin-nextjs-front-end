// File: components/Dialogs/BaseModalDialog.tsx
'use client';

import React, { useCallback } from 'react';
import styles from '@/styles/Modal.module.css';
import { InputState } from '@/lib/structure';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanel/SharedPanelContext';

export default function BaseModalDialog({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const { setInputState } = useSharedPanelContext();

  const closeDialog = useCallback(() => {
    setInputState(InputState.CLOSE_INPUT);
  }, [setInputState]);

  return (
    <div
      id={id}
      className={styles.modalContainer}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
    >
      <div className="relative h-8 px-3 mb-1 text-gray-600">
        <h1
          id={`${id}-title`}
          className="absolute left-1/2 bottom-0 translate-x-[-50%] text-lg"
        >
          {title}
        </h1>
        <button
          aria-label="Close dialog"
          onClick={closeDialog}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border-none w-5 text-xl text-white hover:text-gray-400"
        >
          ×
        </button>
      </div>
      <div className={`${styles.modalBox} flex flex-col h-full max-h-[80vh] min-h-0`}>
        {children}
      </div>
    </div>
  );
}
