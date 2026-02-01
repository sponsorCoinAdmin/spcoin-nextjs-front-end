// Dir: @/components/views/RadioOverlayPanels/AccountListRewardsPanel
'use client';

import React from 'react';

export default function ExpandWrap({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className={[
        'grid transition-[grid-template-rows,opacity,transform] duration-200 ease-out',
        open ? 'grid-rows-[1fr] opacity-100 translate-y-0' : 'grid-rows-[0fr] opacity-0 -translate-y-1',
      ].join(' ')}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
