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

const looksLikePanelNode = (v: any) => v && typeof v.panel === 'number';

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

  // dot-path classifiers
  const isPanelArrayItem =
    (/\.mainPanelNode\.\d+$/.test(path) || /\.children\.\d+$/.test(path)) && looksLikePanelNode(value);

  // ⬅️ NEW: treat any array labeled exactly "children" as a pure container (no row rendered)
  const isChildrenContainer = isArray && label === 'children';

  // helper: set expansion open if currently closed
  const ensureOpen = (p: string) => {
    if (!exp[p]) togglePath(p);
  };

  // Track visible changes for panel rows (helps catch "parent closed" side-effect)
  const lastVisibleRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (isPanelArrayItem) {
      const vis = !!(value as any)?.visible;
      if (lastVisibleRef.current !== vis) {

        lastVisibleRef.current = vis;

        // If a panel becomes visible, auto-expand its own row and its parent children container
        if (vis) {
          ensureOpen(path);
          // try to expand parent children container if exists
          const parentChildrenPath = path.replace(/\.\d+$/, '') + '.children'; // rough but works for known shapes
          if (parentChildrenPath !== path && parentChildrenPath.includes('.children')) {
            ensureOpen(parentChildrenPath);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPanelArrayItem, value?.visible, path, label]);

  // ──────────────────────────────────────────────────────────────
  // BRANCH NODES (objects & arrays)
  // ──────────────────────────────────────────────────────────────
  if (isBranch) {
    // Count entries (arrays vs objects)
    const numEntries = isArray ? (value as any[]).length : Object.keys(value as object).length;
    const hasEntries = numEntries > 0;

    // Expanded state:
    let expanded = false;
    if (hasEntries) {
      if (isPanelArrayItem) {
        // HARD-GATE: panel nodes expand ONLY when they are visible.
        expanded = (value as any)?.visible === true;
      } else if (isChildrenContainer) {
        // ⬅️ NEW: children containers never render their own row; we always render their items.
        expanded = true;
      } else {
        expanded = !!exp[path];
      }
    }

    const onRowClick = () => {


      if (isPanelArrayItem) {
        const panelId = (value as any).panel as SP_COIN_DISPLAY;
        const currentlyVisible = !!(value as any).visible;

        // Toggle by visibility (source of truth)
        if (!currentlyVisible) {
          openPanel(panelId);
          // When we make it visible, ensure its UI expansion flag is open too
          ensureOpen(path);
        } else {
          // When hiding, we do NOT force-collapse the UI expansion flag;
          // but since "expanded" is derived from visibility, it will close visually.
          closePanel(panelId);
        }
      } else if (hasEntries) {
        // UI-only expand/collapse
         togglePath(path);
      } 
    };

      // Build children entries (dot paths)
    const keys = isArray ? (value as any[]).map((_, i) => String(i)) : Object.keys(value as object);

    // ⬅️ NEW: If this is a "children" container, DO NOT render a row for it.
    // Render its items directly at the same depth (no "[-] children" or "[+] children" row at any level).
    if (isChildrenContainer) {
      return (
        <>
          {expanded &&
            keys.map((k) => {
              const childPath = `${path}.${k}`;
              const childVal = (value as any[])[Number(k)];

              // Label: show index and enum name if it's a panel node
              let childLabel = `[${k}]`;
              if (looksLikePanelNode(childVal)) {
                const enumName = SP_COIN_DISPLAY[(childVal as any).panel];
                if (typeof enumName === 'string') childLabel = `[${k}] ${enumName}`;
              }

              return (
                <Branch
                  key={childPath}
                  label={childLabel}
                  value={childVal}
                  depth={depth}              // same depth (no "children" row shown)
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
          path={path}            // pass path for Row logs (debug only)
          depth={depth}
          // NOTE: For panel nodes, the "open" marker mirrors *visibility* only.
          open={hasEntries ? (isPanelArrayItem ? ((value as any)?.visible === true) : expanded) : undefined}
          clickable={isPanelArrayItem || hasEntries}
          onClick={onRowClick}
          dense={dense}
        />
        {/* For panel nodes: children render ONLY when the node is visible */}
        {(isPanelArrayItem ? ((value as any)?.visible === true) : expanded) &&
          keys.map((k) => {
            const childPath = `${path}.${k}`;
            const childVal = isArray ? (value as any[])[Number(k)] : (value as any)[k];

            // Minimal label to keep layout intact
            let childLabel = isArray ? `[${k}]` : k;

            // If listing panel nodes under mainPanelNode/children, append enum name
            if (isArray && (label === 'mainPanelNode' || label === 'children') && looksLikePanelNode(childVal)) {
              const enumName = SP_COIN_DISPLAY[(childVal as any).panel];
              if (typeof enumName === 'string') childLabel = `[${k}] ${enumName}`;
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
  // LEAF NODES (primitives) — unchanged layout
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
