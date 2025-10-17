// File: components/Buttons/CloseButton.tsx
'use client';

import React from 'react';

type Props = {
  closeCallback: () => void;
  id?: string;
  className?: string;
  title?: string;
  ariaLabel?: string;
};

export default function CloseButton({
  closeCallback,
  id = 'closeSelectionPanelButton',
  className,
  title = 'Close',
  ariaLabel = 'Close',
}: Props) {
  return (
    <button
      id={id}
      type='button'
      aria-label={ariaLabel}
      title={title}
      onClick={closeCallback}
      className={
        className ??
        `absolute top-1 right-1 h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] 
         flex items-center justify-center leading-none transition-colors text-3xl
         hover:bg-[#5981F3] hover:text-[#243056]`
      }
    >
      ×
    </button>
  );
}
