// File: @/components/views/AssetSelectPanels/PanelScrollSlot.tsx
'use client';

import React from 'react';

type Props = {
  id?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * ✅ SSOT scroll container contract:
 * - Must live inside a flex-col parent that is h-full + min-h-0
 * - This element becomes the ONLY scroll region
 * - Adds bottom breathing room so last row isn't edge-to-edge
 */
export default function PanelScrollSlot({ id, className, children }: Props) {
  return (
    <div
      id={id}
      className={[
        // fill remaining height and allow child overflow to scroll
        'flex-1 min-h-0',
        // scrolling
        'overflow-x-auto overflow-y-auto',
        // bottom breathing room (works like TokenList panel feel)
        'pb-3 md:pb-4',
        // optional safe-area support on iOS
        '[padding-bottom:calc(theme(spacing.3)+env(safe-area-inset-bottom))] md:[padding-bottom:calc(theme(spacing.4)+env(safe-area-inset-bottom))]',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </div>
  );
}
