'use client';

import React from 'react';

export const PlusMarker: React.FC<{ onClick?: () => void; title?: string; className?: string }> = ({
  onClick,
  title = 'Expand',
  className = '',
}) => (
  <button
    type="button"
    className={`inline-block mr-1 underline-offset-2 hover:underline text-[#22c55e] ${className}`}
    onClick={onClick}
    aria-label="Expand"
    title={title}
  >
    [+]
  </button>
);

export const MinusMarker: React.FC<{ onClick?: () => void; title?: string; className?: string }> = ({
  onClick,
  title = 'Collapse',
  className = '',
}) => (
  <button
    type="button"
    className={`inline-block mr-1 underline-offset-2 hover:underline text-[#f59e0b] ${className}`}
    onClick={onClick}
    aria-label="Collapse"
    title={title}
  >
    [-]
  </button>
);
