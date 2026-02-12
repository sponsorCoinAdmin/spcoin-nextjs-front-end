// File: @/app/(menu)/Test/Tabs/FSMTrace/FSMTraceTab.tsx
'use client';

import React from 'react';
import FSMTracePanel from '@/components/debug/FSMTracePanel';

type FSMTraceTabProps = {
  panelKey: number;
};

export default function FSMTraceTab({ panelKey }: FSMTraceTabProps) {
  return (
    <div className='h-full min-h-0'>
      <div id='fsm-trace-panel-container' className='h-full min-h-0 w-full rounded-none shadow-inner p-4'>
        <FSMTracePanel visible key={panelKey} />
      </div>
    </div>
  );
}
