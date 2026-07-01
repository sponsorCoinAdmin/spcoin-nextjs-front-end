// File: components/shared/ReadOnlyMetaDataTable.tsx
'use client';

import React from 'react';
import { msTableTw } from '@/components/views/RadioOverlayPanels/msTableTw';

const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
const cell = 'px-3 py-3 text-sm align-middle';
const zebraA = 'bg-[rgba(56,78,126,0.35)]';
const zebraB = 'bg-[rgba(156,163,175,0.25)]';
const tableGrid = 'grid grid-cols-[max-content_minmax(0,1fr)]';

export type MetaDataRow = {
  label: string;
  value: React.ReactNode;
};

type Props = {
  rows: MetaDataRow[];
  logoURL?: string;
  logoAlt?: string;
  logoVisible?: boolean;
  id?: string;
  className?: string;
};

export default function ReadOnlyMetaDataTable({
  rows,
  logoURL,
  logoAlt = '',
  logoVisible = true,
  id,
  className = '',
}: Props) {
  return (
    <div id={id} className={`flex flex-col gap-0 ${className}`}>
      {logoVisible && logoURL ? (
        <div className="flex justify-center items-center p-2 bg-[#0b0e19] border border-black rounded-xl">
          <img
            src={logoURL}
            alt={logoAlt}
            className="w-full max-w-[320px] aspect-square rounded-full object-contain bg-[#11162A]"
          />
        </div>
      ) : null}

      <div className="scrollbar-hide mb-4 mt-0 w-full min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-black">
        <div className={`w-full min-w-0 ${tableGrid}`}>
          <div className="contents">
            <div className={`${msTableTw.theadRow} ${th} whitespace-nowrap border-b border-black`}>
              Field Name
            </div>
            <div className={`${msTableTw.theadRow} ${th} border-b border-black`}>
              Value
            </div>
          </div>

          {rows.map(({ label, value }, index) => {
            const zebra = index % 2 === 0 ? zebraA : zebraB;
            const isLast = index === rows.length - 1;
            return (
              <div className="contents" key={label}>
                <div className={`${zebra} ${cell} whitespace-nowrap${isLast ? '' : ' border-b border-black'}`}>
                  {label}
                </div>
                <div className={`${zebra} ${cell} min-w-0 break-all${isLast ? '' : ' border-b border-black'}`}>
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
