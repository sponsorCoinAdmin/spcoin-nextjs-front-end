'use client';

import { createPortal } from 'react-dom';
import React from 'react';

type Props = {
  top?: number;
  left?: number;
  portalRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
};

export default function DropdownPortal({ top, left, portalRef, children }: Props) {
  return createPortal(
    <div
      ref={portalRef}
      style={{
        position: 'fixed',
        top: typeof top === 'number' ? top : -9999,
        left: typeof left === 'number' ? left : -9999,
        zIndex: 9999,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
