// File: @/components/views/AssetSelectPanels/PanelScrollSlot.tsx
'use client';

import React from 'react';

type Props = {
  id?: string;
  /** Optional extra classes (applied to the OUTER clipped container) */
  className?: string;
  children: React.ReactNode;
};

/**
 * ✅ SSOT scroll container contract:
 * - Must live inside a flex-col parent that is h-full + min-h-0
 * - OUTER div clips rounded corners (overflow-hidden)
 * - INNER div is the ONLY scroll region (overflow-auto)
 * - Adds bottom breathing room so last row (ex: Total) isn't edge-to-edge
 */
export default function PanelScrollSlot({ id, className, children }: Props) {
  return (
    <div
      id={id}
      className={[
        // occupy remaining height in a flex-col layout
        'flex-1 min-h-0',
        // clip rounded corners + any sticky header shadows cleanly
        'overflow-hidden',
        className ?? '',
      ].join(' ')}
    >
      <div
        className={[
          // ✅ the ONLY scrolling element
          'h-full w-full overflow-x-auto overflow-y-auto',
          // hide scrollbars (matches your table wrapper behavior)
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          // padding: provide bottom "breathing room" consistently
          'pb-3 md:pb-4',
          // iOS safe-area support
          '[padding-bottom:calc(theme(spacing.3)+env(safe-area-inset-bottom))]',
          'md:[padding-bottom:calc(theme(spacing.4)+env(safe-area-inset-bottom))]',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
