// File: app/(menu)/Test/Tabs/ExchangeContext/components/Tree/TreeView.tsx
'use client';

import React from 'react';
import Branch from './Branch';

type Props = {
  label: string;
  value: any;
  exp: Record<string, boolean>;
  onTogglePath: (path: string) => void;
  enumRegistry: Record<string, Record<number, string>>;
  dense?: boolean;
  /** Starting visual depth (indent) for this subtree. */
  rootDepth?: number;
};

const TreeView: React.FC<Props> = ({
  label,
  value,
  exp,
  onTogglePath,
  enumRegistry,
  dense = true,
  rootDepth = 0,
}) => {
  return (
    <Branch
      label={label}
      value={value}
      depth={rootDepth}
      path={`rest.${label}`}
      exp={exp}
      togglePath={onTogglePath}
      enumRegistry={enumRegistry}
      dense={dense}
    />
  );
};

export default TreeView;
