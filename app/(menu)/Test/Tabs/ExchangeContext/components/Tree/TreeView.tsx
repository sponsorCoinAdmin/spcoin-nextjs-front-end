// File: app/(menu)/Test/Tabs/ExchangeContext/components/Tree/TreeView.tsx
'use client';

import React, { useMemo } from 'react';
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
  // Normalize the root path so guards in useExpandCollapse accept it.
  const rootPath = useMemo(
    () => (label === 'settings' ? 'rest.settings' : `rest.${label}`),
    [label]
  );

  return (
    <Branch
      label={label}
      value={value}
      depth={rootDepth}
      path={rootPath}
      exp={exp}
      togglePath={onTogglePath}
      enumRegistry={enumRegistry}
      dense={dense}
    />
  );
};

export default TreeView;
