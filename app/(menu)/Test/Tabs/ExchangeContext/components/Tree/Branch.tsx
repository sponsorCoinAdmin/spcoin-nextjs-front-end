// File: app/(menu)/Test/Tabs/ExchangeContext/components/Tree/Branch.tsx
'use client';

import React from 'react';
import Row from './Row';
import { isObjectLike, quoteIfString } from '../../utils/object';

type BranchProps = {
  label: string;
  value: any;
  depth: number;
  path: string;
  exp: Record<string, boolean>;
  togglePath: (path: string) => void;
  enumRegistry: Record<string, Record<number, string>>;
  dense?: boolean;
};

const Branch: React.FC<BranchProps> = ({ label, value, depth, path, exp, togglePath, enumRegistry, dense }) => {
  if (isObjectLike(value)) {
    const expanded = !!exp[path];
    const keys = Array.isArray(value) ? value.map((_, i) => String(i)) : Object.keys(value);
    return (
      <>
        <Row text={label} depth={depth} open={expanded} clickable onClick={() => togglePath(path)} dense={dense} />
        {expanded &&
          keys.map((k) => {
            const childPath = `${path}.${k}`;
            const childVal = Array.isArray(value) ? value[Number(k)] : (value as any)[k];
            const childLabel = Array.isArray(value) ? `[${k}]` : k;
            return (
              <Branch
                key={childPath}
                label={childLabel}
                value={childVal}
                depth={depth + 1}
                path={childPath}
                exp={exp}
                togglePath={togglePath}
                enumRegistry={enumRegistry}
                dense={dense}
              />
            );
          })}
      </>
    );
  }

  // Primitive leaf
  const lineClass = dense ? 'flex items-center leading-tight' : 'flex items-center leading-6';
  const enumForKey = enumRegistry[label];

  const content =
    enumForKey && typeof value === 'number' ? (
      <>
        {`${label}(${value}): `}
        <span className="text-[#5981F3]">{typeof enumForKey[value] === 'string' ? enumForKey[value] : `[${value}]`}</span>
      </>
    ) : (
      <>
        {`${label}: `}
        <span className="text-[#5981F3]">{quoteIfString(value)}</span>
      </>
    );

  return (
    <div className={`font-mono ${lineClass} text-slate-200 m-0 p-0`}>
      <span className="whitespace-pre select-none">{'  '.repeat(depth)}</span>
      <span>{content}</span>
    </div>
  );
};

export default Branch;
