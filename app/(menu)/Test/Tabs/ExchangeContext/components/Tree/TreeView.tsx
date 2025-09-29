// File: app/(menu)/Test/Tabs/ExchangeContext/components/Tree/TreeView.tsx
'use client';

import React, { useCallback, useMemo } from 'react';
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
  // (Prevents issues if `label` ever contains spaces or decorative text.)
  const rootPath = useMemo(() => {
    return label === 'settings' ? 'rest.settings' : `rest.${label}`;
  }, [label]);

  // Lightweight logger wrapper — leaves the core logic untouched.
  const onTogglePathLogged = useCallback(
    (path: string) => {
      // eslint-disable-next-line no-console
      console.log('[TreeView] toggle request', {
        rootLabel: label,
        rootPath,
        path,
      });
      onTogglePath(path);
    },
    [onTogglePath, label, rootPath]
  );

  return (
    <Branch
      label={label}
      value={value}
      depth={rootDepth}
      path={rootPath}
      exp={exp}
      togglePath={onTogglePathLogged}
      enumRegistry={enumRegistry}
      dense={dense}
    />
  );
};

export default TreeView;
