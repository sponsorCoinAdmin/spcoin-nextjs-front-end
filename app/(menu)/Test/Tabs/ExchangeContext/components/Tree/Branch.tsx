// File: app/(menu)/Test/Tabs/ExchangeContext/components/Tree/Branch.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import Row from './Row';
import { quoteIfString } from '../../utils/object';
import { SP_COIN_DISPLAY } from '@/lib/structure';
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

// Support BOTH shapes: virtual registry nodes { id } and persisted nodes { panel }
const panelIdOf = (v: any): number | undefined =>
  v && typeof v === 'object'
    ? (typeof v.id === 'number' ? (v.id as number)
      : (typeof v.panel === 'number' ? (v.panel as number) : undefined))
    : undefined;

const looksLikePanelNode = (v: any) =>
  v && typeof v === 'object' && typeof panelIdOf(v) === 'number' && 'visible' in v;

const nameForPanel = (v: any): string => {
  if (!looksLikePanelNode(v)) return '';
  if (typeof v.name === 'string' && v.name.length > 0) return v.name;
  const pid = panelIdOf(v)!;
  const mapped = (SP_COIN_DISPLAY as any)?.[pid];
  return typeof mapped === 'string' ? mapped : String(pid);
};

// Arrays that should show "[idx] PANEL_NAME" for their panel-node children
const PANEL_ARRAY_LABELS = new Set(['spCoinPanelTree', 'children']);

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

  // dot-path classifier for panel nodes (works for both shapes)
  const isPanelArrayItem =
    /\.(spCoinPanelTree|children)\.\d+$/.test(path) && looksLikePanelNode(value);

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
        const pid = panelIdOf(value);
        if (typeof pid === 'number') {
          const currentlyVisible = !!(value as any).visible;
          if (!currentlyVisible) {
            openPanel(pid);
            ensureOpen(path);
            ensureOpen(`${path}.children`);
          } else {
            closePanel(pid);
          }
          return;
        }
      }
      if (hasEntries) togglePath(path);
    };

    // Hide "name" inside panel node bodies (avoid duplication)
    const isPanelNode = looksLikePanelNode(value);
    const keys = isArray
      ? (value as any[]).map((_, i) => String(i))
      : Object.keys(value as object).filter((k) => !(isPanelNode && k === 'name'));

    // "children" container renders items directly (no own row)
    if (isChildrenContainer) {
      return (
        <>
          {expanded &&
            keys.map((k) => {
              const childPath = `${path}.${k}`;
              const childVal = (value as any[])[Number(k)];

              // Label: show index and enum/name if it's a panel node
              let childLabel = `[${k}]`;
              if (looksLikePanelNode(childVal)) {
                const displayName = nameForPanel(childVal);
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

            // Append enum/name for arrays that contain panel nodes,
            // including top-level "spCoinPanelTree" and "children"
            if (
              isArray &&
              PANEL_ARRAY_LABELS.has(label) &&
              looksLikePanelNode(childVal)
            ) {
              const displayName = nameForPanel(childVal);
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
