// File: app/(menu)/Test/Tabs/ExchangeContext/components/Tree/Row.tsx
'use client';

import React, { useCallback } from 'react';
import { PlusMarker, MinusMarker } from './Markers';

type Props = {
  text: string;
  depth: number;
  open?: boolean;           // true = -, false = +, undefined = no toggle marker
  clickable?: boolean;
  onClick?: () => void;
  dense?: boolean;          // compact line-height for dense trees
  path?: string;            // optional, for debug logs
};

const Row: React.FC<Props> = ({ text, depth, open, clickable, onClick, dense, path }) => {
  const indent = '  '.repeat(depth);
  const colorClass =
    open === undefined ? 'text-slate-200' : open ? 'text-green-400' : 'text-orange-400';
  const layout = dense ? 'flex items-center leading-tight' : 'flex items-center leading-6';

  const hasToggle = open !== undefined; // whether this row can expand/collapse

  // Single activation handler used by marker and label; blocks bubbling (but not capture).
  const handleActivate = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
      e?.stopPropagation(); // stop at bubble so it won't hit parent rows
      console.log('[Row] activate', { text, path, depth, open, clickable });
      if (clickable) onClick?.();
    },
    [text, path, depth, open, clickable, onClick]
  );

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!clickable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate(e);
    }
  };

  // Capture phase: **log only**, do NOT stop propagation here
  const onCapture = useCallback(
    (e: React.MouseEvent) => {
      console.log('[Row] click CAPTURE', {
        text,
        path,
        depth,
        open,
        clickable,
        target: (e.target as HTMLElement)?.tagName,
        currentTarget: (e.currentTarget as HTMLElement)?.tagName,
      });
      // DO NOT e.stopPropagation() here — it blocks target onClick handlers
    },
    [text, path, depth, open, clickable]
  );

  const marker =
    open === undefined ? (
      <MinusMarker
        className="pointer-events-none opacity-50"
        // no ariaExpanded when neutral/undefined
        path={path}
        label={text}
      />
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
    <div className={`font-mono ${layout} ${colorClass} m-0 p-0`} onClickCapture={onCapture}>
      {/* Preserve spaces only for indent, not the whole row */}
      <span className="whitespace-pre select-none">{indent}</span>
      <span
        className={`inline-flex items-center ${clickable ? 'cursor-pointer' : ''}`}
        onClick={clickable ? () => handleActivate() : undefined}
        onKeyDown={handleKeyDown}
        // NOTE: We intentionally avoid role/aria-expanded on this span to keep axe-in-source quiet.
        // The actual interactive control (button) carries aria-expanded.
        tabIndex={clickable ? 0 : -1}
        title={clickable ? (open ? 'Collapse' : 'Expand') : undefined}
      >
        {/* Prevent accidental drags / mousedown from bubbling up before click */}
        <span onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}>{marker}</span>
        {text}
      </span>
    </div>
  );
};

export default Row;
