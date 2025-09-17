// File: app/(menu)/Test/Tabs/ExchangeContext/components/Tree/Row.tsx
'use client';

import React from 'react';
import { PlusMarker, MinusMarker } from './Markers';

type Props = {
  text: string;
  depth: number;
  open?: boolean;           // true = -, false = +, undefined = no toggle marker
  clickable?: boolean;
  onClick?: () => void;
  dense?: boolean;          // compact line-height for dense trees
};

const Row: React.FC<Props> = ({ text, depth, open, clickable, onClick, dense }) => {
  const indent = '  '.repeat(depth);
  const colorClass = open === undefined ? 'text-slate-200' : open ? 'text-green-400' : 'text-orange-400';
  const layout = dense ? 'flex items-center leading-tight' : 'flex items-center leading-6';

  const markerEl =
    open === undefined ? (
      <MinusMarker className="pointer-events-none" />
    ) : open ? (
      <MinusMarker className={clickable ? '' : 'cursor-default'} onClick={clickable ? onClick : undefined} />
    ) : (
      <PlusMarker className={clickable ? '' : 'cursor-default'} onClick={clickable ? onClick : undefined} />
    );

  return (
    <div className={`font-mono ${layout} ${colorClass} m-0 p-0`}>
      {/* Preserve spaces only for indent, not the whole row */}
      <span className="whitespace-pre select-none">{indent}</span>
      <span className="inline-flex items-center">
        {markerEl}
        {text}
      </span>
    </div>
  );
};

export default Row;
