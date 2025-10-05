// File: app/(menu)/Test/Tabs/ExchangeContext/components/Tree/Branch.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import Row from './Row';
import { quoteIfString } from '../../utils/object';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

type BranchProps = {
  label: string;
  value: any;
  depth: number;
  path: string; // dot style: a.b.c.0.children
  exp: Record<string, boolean>;
  togglePath: (path: string) => void;
  enumRegistry: Record<string, Record<number, string>>;
  dense?: boolean;
};

// This page renders VIRTUAL nodes: { id, name, visible, children }
const looksLikeVirtualPanelNode = (v: any) =>
  v && typeof v.id === 'number' && 'visible' in v;

const nameForVirtual = (v: any): string => {
  if (!looksLikeVirtualPanelNode(v)) return '';
  if (typeof v.name === 'string' && v.name.length > 0) return v.name;
  const mapped = (SP_COIN_DISPLAY as any)?.[v.id];
  return typeof mapped === 'string' ? mapped : String(v.id);
};

// Arrays that should show "[idx] PANEL_NAME" for their virtual children
const PANEL_ARRAY_LABELS = new Set(['spCoinPanelTree', 'children', 'mainPanelNode']);

const Branch: React.FC<BranchProps> = ({
  label,
  value,
  depth,
  path,
  exp,
  togglePath,
  enumRegistry,
  dense,
}) => {
  const { openPanel, closePanel } = usePanelTree();

  const isArray = Array.isArray(value);
  const isObject = value !== null && typeof value === 'object' && !isArray;
  const isBranch = isArray || isObject;

  // dot-path classifiers for *virtual* panel nodes (now includes mainPanelNode)
  const isPanelArrayItem =
    (/\.(spCoinPanelTree|children|mainPanelNode)\.\d+$/.test(path)) &&
    looksLikeVirtualPanelNode(value);

  // Treat any array labeled exactly "children" as a pure container (no row rendered)
  const isChildrenContainer = isArray && label === 'children';

  const ensureOpen = (p: string) => {
    if (!exp[p]) togglePath(p);
  };

  const lastVisibleRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (isPanelArrayItem) {
      const vis = !!(value as any)?.visible;
      if (lastVisibleRef.current !== vis) {
        lastVisibleRef.current = vis;
        if (vis) {
          ensureOpen(path);
          ensureOpen(`${path}.children`);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPanelArrayItem, value?.visible, path, label]);

  // ──────────────────────────────────────────────────────────────
  // BRANCH NODES (objects & arrays)
  // ──────────────────────────────────────────────────────────────
  if (isBranch) {
    const numEntries = isArray ? (value as any[]).length : Object.keys(value as object).length;
    const hasEntries = numEntries > 0;

    // Expanded state:
    let expanded = false;
    if (hasEntries) {
      if (isPanelArrayItem) {
        expanded = (value as any)?.visible === true;
      } else if (isChildrenContainer) {
        expanded = true;
      } else {
        expanded = !!exp[path];
      }
    }

    const onRowClick = () => {
      if (isPanelArrayItem) {
        const panelId = (value as any).id as number;
        const currentlyVisible = !!(value as any).visible;
        if (!currentlyVisible) {
          openPanel(panelId);
          ensureOpen(path);
          ensureOpen(`${path}.children`);
        } else {
          closePanel(panelId);
        }
      } else if (hasEntries) {
        togglePath(path);
      }
    };

    // Hide "name" inside virtual panel node bodies (avoid duplication)
    const isVirtualNode = looksLikeVirtualPanelNode(value);
    const keys = isArray
      ? (value as any[]).map((_, i) => String(i))
      : Object.keys(value as object).filter((k) => !(isVirtualNode && k === 'name'));

    // "children" container renders items directly (no own row)
    if (isChildrenContainer) {
      return (
        <>
          {expanded &&
            keys.map((k) => {
              const childPath = `${path}.${k}`;
              const childVal = (value as any[])[Number(k)];

              // Label: show index and enum/name if it's a virtual panel node
              let childLabel = `[${k}]`;
              if (looksLikeVirtualPanelNode(childVal)) {
                const displayName = nameForVirtual(childVal);
                childLabel = `[${k}] ${displayName}`;
              }

              return (
                <Branch
                  key={childPath}
                  label={childLabel}
                  value={childVal}
                  depth={depth} // same depth (no "children" row shown)
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

    return (
      <>
        <Row
          text={label}
          path={path}
          depth={depth}
          open={hasEntries ? (isPanelArrayItem ? ((value as any)?.visible === true) : expanded) : undefined}
          clickable={isPanelArrayItem || hasEntries}
          onClick={onRowClick}
          dense={dense}
        />
        {(isPanelArrayItem ? ((value as any)?.visible === true) : expanded) &&
          keys.map((k) => {
            const childPath = `${path}.${k}`;
            const childVal = isArray ? (value as any[])[Number(k)] : (value as any)[k];

            // Minimal label to keep layout intact
            let childLabel = isArray ? `[${k}]` : k;

            // ✅ Append enum/name for arrays that contain virtual panel nodes,
            //    including top-level "mainPanelNode"
            if (
              isArray &&
              PANEL_ARRAY_LABELS.has(label) &&
              looksLikeVirtualPanelNode(childVal)
            ) {
              const displayName = nameForVirtual(childVal);
              childLabel = `[${k}] ${displayName}`;
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

  // ──────────────────────────────────────────────────────────────
  // LEAF NODES (primitives)
  // ──────────────────────────────────────────────────────────────
  const lineClass = dense ? 'flex items-center leading-tight' : 'flex items-center leading-6';
  const enumForKey = enumRegistry[label];

  const content =
    enumForKey && typeof value === 'number' ? (
      <>
        {`${label}(${value}): `}
        <span className="text-[#5981F3]">
          {typeof enumForKey[value] === 'string' ? enumForKey[value] : `[${value}]`}
        </span>
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
