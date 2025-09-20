// File: app/(menu)/Test/Tabs/ExchangeContext/components/Tree/Markers.tsx
'use client';

import React from 'react';

const DBG = process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true';

type MarkerProps = {
  onClick?: () => void;
  title?: string;
  className?: string;
  // optional debug-only context (safe to omit)
  path?: string;
  label?: string;

  // A11y (optional) — pass from Row/Branch when the node is expandable
  ariaExpanded?: boolean;   // when defined, we render aria-expanded
  ariaControls?: string;    // id of the controlled region (optional)
};

// Helper to conditionally add ARIA attributes so axe-in-source doesn’t see "{expression}"
function ariaAttrs(expanded?: boolean, controls?: string) {
  return {
    ...(expanded === undefined ? {} : { 'aria-expanded': expanded }),
    ...(controls ? { 'aria-controls': controls } : {}),
  };
}

export const PlusMarker: React.FC<MarkerProps> = ({
  onClick,
  title = 'Expand',
  className = '',
  path,
  label,
  ariaExpanded,
  ariaControls,
}) => (
  <button
    type="button"
    className={`inline-block mr-1 underline-offset-2 hover:underline text-[#22c55e] ${className}`}
    aria-label="Expand"
    title={title}
    {...ariaAttrs(ariaExpanded, ariaControls)}
    onMouseDown={(e) => e.stopPropagation()}
    onClick={(e) => {
      e.stopPropagation();
      console.log('[Marker][+]', { path, label });
      onClick?.();
    }}
  >
    [+]
  </button>
);

export const MinusMarker: React.FC<MarkerProps> = ({
  onClick,
  title = 'Collapse',
  className = '',
  path,
  label,
  ariaExpanded,
  ariaControls,
}) => (
  <button
    type="button"
    className={`inline-block mr-1 underline-offset-2 hover:underline text-[#f59e0b] ${className}`}
    aria-label="Collapse"
    title={title}
    {...ariaAttrs(ariaExpanded, ariaControls)}
    onMouseDown={(e) => e.stopPropagation()}
    onClick={(e) => {
      e.stopPropagation();
      if (DBG) console.debug('[Marker][-]', { path, label });
      onClick?.();
    }}
  >
    [-]
  </button>
);
