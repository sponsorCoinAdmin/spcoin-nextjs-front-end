// File: @/app/(menu)/Test/Tabs/ExchangeContext/components/Tree/Row.tsx
'use client';

import React, { useCallback } from 'react';
import { PlusMarker, MinusMarker } from './Markers';
import { createDebugLogger } from '@/lib/utils/debugLogger';

type Props = {
  text: string;
  depth: number;
  open?: boolean; // true = -, false = +, undefined = no toggle marker
  clickable?: boolean;
  onClick?: () => void;
  dense?: boolean;
  path?: string;
};

const debugLog = createDebugLogger(
  'ExchangeContextTreeRow',
  (process.env.NEXT_PUBLIC_DEBUG_TREE ?? 'false').toLowerCase() === 'true'
);

const Row: React.FC<Props> = ({ text, depth, open, clickable, onClick, dense, path }) => {
  const indent = '  '.repeat(depth);

  // color derives from `open` (for panel rows, open ≡ visible)
  const colorClass =
    open === undefined ? 'text-slate-200' : open ? 'text-green-400' : 'text-red-400';
  const layout = dense ? 'flex items-center leading-tight' : 'flex items-center leading-6';

  const handleActivate = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
      e?.stopPropagation();
      if (clickable) onClick?.();
    },
    [clickable, onClick]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!clickable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate(e);
    }
  };

  debugLog.log?.('[Row] render', { text, path, depth, open, clickable, colorClass });

  const marker =
    open === undefined ? (
      <MinusMarker className='pointer-events-none opacity-50' path={path} label={text} />
    ) : open ? (
      <MinusMarker
        className={clickable ? 'cursor-pointer' : 'cursor-default'}
        onClick={clickable ? () => handleActivate() : undefined}
        ariaExpanded={open}
        path={path}
        label={text}
      />
    ) : (
      <PlusMarker
        className={clickable ? 'cursor-pointer' : 'cursor-default'}
        onClick={clickable ? () => handleActivate() : undefined}
        ariaExpanded={open}
        path={path}
        label={text}
      />
    );

  return (
    <div
      className={`font-mono ${layout} ${colorClass} m-0 p-0`}
      data-open={open === undefined ? 'na' : String(open)}
      data-path={path}
    >
      <span className='whitespace-pre select-none'>{indent}</span>
      <span
        className={`inline-flex items-center ${clickable ? 'cursor-pointer' : ''}`}
        onClick={clickable ? () => handleActivate() : undefined}
        onKeyDown={handleKeyDown}
        tabIndex={clickable ? 0 : -1}
        title={clickable ? (open ? 'Collapse' : 'Expand') : undefined}
      >
        <span onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}>{marker}</span>
        {text}
      </span>
    </div>
  );
};

export default Row;
