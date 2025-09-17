// File: app/(menu)/Test/Tabs/ExchangeContext/components/Tree/Branch.tsx
'use client';

import React from 'react';
import Row from './Row';
import { isObjectLike, quoteIfString } from '../../utils/object';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

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

/**
 * Derive the *default* expanded state for PanelNode branches:
 * - If this node is a PanelNode item under `...mainPanelNode.[i]` or `...children.[j]`,
 *   expand by default when `value.visible === true`.
 * - If this node is the `children` container (`...mainPanelNode.[i].children`),
 *   expand by default when *any* child has `visible === true`.
 *
 * NOTE: This is only the default. If the user toggles the row, `exp[path]` wins.
 */
function defaultExpandedFor(path: string, label: string, value: any): boolean {
  const isPanelArrayItem =
    (/\.mainPanelNode\.\d+$/.test(path) || /\.children\.\d+$/.test(path)) &&
    value &&
    typeof value.visible === 'boolean';

  if (isPanelArrayItem) {
    return !!value.visible;
  }

  const isChildrenContainer = /\.mainPanelNode\.\d+\.children$/.test(path) && Array.isArray(value);
  if (isChildrenContainer) {
    return value.some((c) => c && typeof c.visible === 'boolean' && c.visible);
  }

  return false;
}

const Branch: React.FC<BranchProps> = ({ label, value, depth, path, exp, togglePath, enumRegistry, dense }) => {
  const { openPanel, closePanel } = usePanelTree();

  if (isObjectLike(value)) {
    // Effective expanded: explicit UI toggle wins; otherwise follow PanelNode.visible defaults
    const expanded = (path in exp) ? !!exp[path] : defaultExpandedFor(path, label, value);

    const isArray = Array.isArray(value);
    const keys = isArray ? value.map((_: any, i: number) => String(i)) : Object.keys(value);

    // Click handler that both toggles UI and (for PanelNode items) updates ExchangeContext via open/closePanel
    const onRowClick = () => {
      const willExpand = !expanded;
      togglePath(path);

      // If this row represents a PanelNode array item, mirror expansion -> visibility
      const isPanelArrayItem =
        (/\.mainPanelNode\.\d+$/.test(path) || /\.children\.\d+$/.test(path)) &&
        value &&
        typeof value.panel === 'number';

      if (isPanelArrayItem) {
        const panelId = value.panel as SP_COIN_DISPLAY;
        if (willExpand) {
          openPanel(panelId);
        } else {
          closePanel(panelId);
        }
      }
      // Note: for the "children" container row itself, we *only* toggle UI (no open/closePanel).
    };

    return (
      <>
        <Row text={label} depth={depth} open={expanded} clickable onClick={onRowClick} dense={dense} />
        {expanded &&
          keys.map((k) => {
            const childPath = `${path}.${k}`;
            const childVal = isArray ? value[Number(k)] : (value as any)[k];

            // Relabel array items:
            //   [idx] (default)
            //   [idx]: PANELNAME (when parent label is "mainPanelNode" or "children" AND child has numeric .panel)
            let childLabel: string;
            if (isArray) {
              let suffix = '';
              const looksLikePanelNode =
                (label === 'mainPanelNode' || label === 'children') &&
                childVal &&
                typeof childVal.panel === 'number';

              if (looksLikePanelNode) {
                const enumName = SP_COIN_DISPLAY[childVal.panel];
                if (typeof enumName === 'string') suffix = `: ${enumName}`;
              }
              childLabel = `[${k}]${suffix}`;
            } else {
              childLabel = k;
            }

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
