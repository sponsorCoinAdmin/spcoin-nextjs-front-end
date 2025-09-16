'use client';

import React from 'react';
import Row from './Row';
import { isObjectLike, quoteIfString } from './utils';

type BranchProps = {
  label: string;
  value: any;
  depth: number;
  path: string;
  exp: Record<string, boolean>;
  togglePath: (path: string) => void;
  enumRegistry: Record<string, Record<number, string>>;
};

const Branch: React.FC<BranchProps> = ({ label, value, depth, path, exp, togglePath, enumRegistry }) => {
  if (isObjectLike(value)) {
    const expanded = !!exp[path];
    const keys = Array.isArray(value) ? value.map((_, i) => String(i)) : Object.keys(value);
    return (
      <>
        <Row text={label} depth={depth} open={expanded} clickable onClick={() => togglePath(path)} />
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
              />
            );
          })}
      </>
    );
  }

  // Pretty-print enums when key is in enumRegistry
  const enumForKey = enumRegistry[label];
  if (enumForKey && typeof value === 'number') {
    const enumLabel = enumForKey[value];
    const pretty = typeof enumLabel === 'string' ? enumLabel : `[${value}]`;
    return (
      <div className="font-mono whitespace-pre leading-6 text-slate-200">
        {'  '.repeat(depth)}
        {`${label}(${value}): `}<span className="text-[#5981F3]">{pretty}</span>
      </div>
    );
  }

  // Default primitive leaf
  return (
    <div className="font-mono whitespace-pre leading-6 text-slate-200">
      {'  '.repeat(depth)}
      {`${label}: `}<span className="text-[#5981F3]">{quoteIfString(value)}</span>
    </div>
  );
};

export default Branch;
