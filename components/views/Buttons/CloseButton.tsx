// File: components/views/Buttons/CloseButton.tsx
'use client';

import React from 'react';
import OpenCloseBtn from './OpenCloseBtn';

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
    <OpenCloseBtn
      id={id}
      onClick={closeCallback}
      type="button"
      expandedGlyph="X"
      expandedTitle={title}
      expandedAriaLabel={ariaLabel}
      className={
        className ??
        'absolute top-1 right-1'
      }
    />
  );
}
