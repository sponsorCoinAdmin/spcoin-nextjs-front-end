'use client';

import { createPortal } from 'react-dom';
import React, { useEffect } from 'react';

type Props = {
  top?: number;
  left?: number;
  portalRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
};

/* ── Local CSS (applied via className) ───────────────────────── */
const DROPDOWN_STYLES = `
  .dropdown-portal {
    position: fixed;
    z-index: 9999;
    top: var(--dp-top, -9999px);
    left: var(--dp-left, -9999px);
  }
`;

export default function DropDownPortal({ top, left, portalRef, children }: Props) {
  // Update CSS variables on the element—keeps JSX free of inline styles.
  useEffect(() => {
    const el = portalRef.current;
    if (!el) return;

    el.style.setProperty('--dp-top', typeof top === 'number' ? `${top}px` : '-9999px');
    el.style.setProperty('--dp-left', typeof left === 'number' ? `${left}px` : '-9999px');
  }, [top, left, portalRef]);

  return (
    <>
      <style jsx global>{DROPDOWN_STYLES}</style>
      {createPortal(
        <div ref={portalRef} className="dropdown-portal">
          {children}
        </div>,
        document.body
      )}
    </>
  );
}
