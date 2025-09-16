'use client';

import React from 'react';
import { PlusMarker, MinusMarker } from './Markers';

type Props = {
  text: string;
  depth: number;
  open?: boolean;           // true = -, false = +, undefined = no toggle marker
  clickable?: boolean;
  onClick?: () => void;
};

const Row: React.FC<Props> = ({ text, depth, open, clickable, onClick }) => {
  const indent = '  '.repeat(depth);
  const colorClass = open === undefined ? 'text-slate-200' : open ? 'text-green-400' : 'text-orange-400';

  const markerEl =
    open === undefined ? (
      <MinusMarker className="pointer-events-none" />
    ) : open ? (
      <MinusMarker className={clickable ? '' : 'cursor-default'} onClick={clickable ? onClick : undefined} />
    ) : (
      <PlusMarker className={clickable ? '' : 'cursor-default'} onClick={clickable ? onClick : undefined} />
    );

  return (
    <div className={`font-mono whitespace-pre leading-6 ${colorClass}`}>
      {indent}
      {markerEl}
      {text}
    </div>
  );
};

export default Row;
