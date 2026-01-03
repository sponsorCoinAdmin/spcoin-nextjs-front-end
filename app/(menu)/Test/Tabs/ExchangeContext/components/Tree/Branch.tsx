// File: @/app/(menu)/Test/Tabs/ExchangeContext/omponents/Tree/Branch.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import Row from './Row';
import { quoteIfString } from '../../utils/object';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import {
  MAIN_OVERLAY_GROUP,
  NON_INDEXED_PANELS,
} from '@/lib/structure/exchangeContext/registry/panelRegistry';

// ✅ Env flags (default to true so current UI is unchanged unless you set them to 'false')
const SHOW_IDS = process.env.NEXT_PUBLIC_TREE_SHOW_IDS !== 'false';
const SHOW_VIS = process.env.NEXT_PUBLIC_TREE_SHOW_VISIBILITY !== 'false';

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

/**
 * Virtual panel nodes can be shaped as either:
 * - { id, name, visible, children }
 * - { panel, name, visible, children }   (common persisted shape)
 */
const getVirtualId = (v: any): number | null => {
  const id = Number(v?.id);
  if (Number.isFinite(id)) return id;

  const panel = Number(v?.panel);
  if (Number.isFinite(panel)) return panel;

  return null;
};

// This page renders VIRTUAL nodes: { id|panel, name, visible, children }
const looksLikeVirtualPanelNode = (v: any) =>
  v && getVirtualId(v) != null && 'visible' in v;

const nameForVirtual = (v: any): string => {
  if (!looksLikeVirtualPanelNode(v)) return '';
  if (typeof v.name === 'string' && v.name.length > 0) return v.name;

  const id = getVirtualId(v);
  if (id == null) return '';

  const mapped = (SP_COIN_DISPLAY as any)?.[id];
  return typeof mapped === 'string' ? mapped : String(id);
};

// Arrays that should show "[idx] PANEL_NAME" for their virtual children
const PANEL_ARRAY_LABELS = new Set(['spCoinPanelTree', 'children']);

/** Format child labels with “non-indexed” and overlay-relative indexing rules. */
function formatChildLabel(childVal: any, defaultIndex: string): string {
  if (!looksLikeVirtualPanelNode(childVal)) return `[${defaultIndex}]`;

  const id = getVirtualId(childVal);
  const displayName = nameForVirtual(childVal);
  if (id == null) return `[${defaultIndex}]`;

  // 1) Never index these
  if (NON_INDEXED_PANELS.has(id as any)) return displayName;

  // 2) For overlays (including TRADING_STATION_PANEL), index by overlay order
  const overlayPos = (MAIN_OVERLAY_GROUP as unknown as number[]).indexOf(id);
  if (overlayPos >= 0) return `[${overlayPos}] ${displayName}`;

  // 3) Fallback to the raw array index
  return `[${defaultIndex}] ${displayName}`;
}

/** ✅ displayStack items render as a single non-toggleable line: [i] {id: X, name: "Y"} */
function formatDisplayStackItem(idxLabel: string, v: any): string {
  const idNum = Number(v?.id);
  const safeId = Number.isFinite(idNum) ? idNum : 'N/A';

  const name =
    typeof v?.name === 'string' && v.name.trim().length ? String(v.name) : 'N/A';

  return `${idxLabel} { id: ${safeId}, name: "${name}" }`;
}

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
  /**
   * ✅ Contract:
   * Tree only calls openPanel / closePanel.
   * Stack membership + visibility semantics are handled inside usePanelTree.
   */
  const { openPanel, closePanel } = usePanelTree();

  const isArray = Array.isArray(value);
  const isObject = value !== null && typeof value === 'object' && !isArray;
  const isBranch = isArray || isObject;

  // dot-path classifiers for *virtual* panel nodes
  const isPanelArrayItem =
    /(\.(spCoinPanelTree|children)\.\d+$)/.test(path) &&
    looksLikeVirtualPanelNode(value);

  /**
   * ✅ displayStack items: always-open, no +/- and no nested fields
   * Support BOTH:
   *  - .settings.displayStack.0
   *  - .displayStack.0   (root)
   */
  const isDisplayStackItem = /(\.(?:settings\.)?displayStack\.\d+$)/.test(path);

  /**
   * ✅ Auto-expand the displayStack container when it exists
   * Support BOTH:
   *  - .settings.displayStack
   *  - .displayStack
   */
  const isDisplayStackContainer = /(\.(?:settings\.)?displayStack$)/.test(path);

  // Treat any array labeled exactly 'children' as a pure container (no row rendered)
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

  // ✅ Render displayStack item rows as a single line (non-toggleable)
  if (isDisplayStackItem) {
    const lineClass = dense ? 'leading-tight' : 'leading-6';
    const text = formatDisplayStackItem(label, value);

    return (
      <div
        className={`font-mono flex items-center ${lineClass} text-slate-200 m-0 p-0`}
      >
        <span className="whitespace-pre select-none">{'  '.repeat(depth)}</span>
        <span className="text-[#5981F3]">{text}</span>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // BRANCH NODES (objects & arrays)
  // ──────────────────────────────────────────────────────────────
  if (isBranch) {
    const numEntries = isArray
      ? (value as any[]).length
      : Object.keys(value as object).length;
    const hasEntries = numEntries > 0;

    // Expanded state:
    let expanded = false;
    if (hasEntries) {
      if (isPanelArrayItem) {
        expanded = (value as any)?.visible === true;
      } else if (isChildrenContainer) {
        expanded = true;
      } else if (isDisplayStackContainer) {
        // ✅ keep displayStack open so you always see items
        expanded = true;
      } else {
        expanded = !!exp[path];
      }
    }

    const onRowClick = () => {
      if (isPanelArrayItem) {
        const panelId = getVirtualId(value);
        if (panelId == null) return;

        const currentlyVisible = !!(value as any).visible;
        const invoker = 'Branch:onRowClick(tree)';

        if (!currentlyVisible) {
          // ✅ openPanel always shows; stack push happens only if stack-member (inside usePanelTree)
          openPanel(panelId as any, invoker);
          ensureOpen(path);
          ensureOpen(`${path}.children`);
        } else {
          // ✅ closePanel(panel) always hides THAT panel; stack remove happens only if stack-member
          closePanel(panelId as any, invoker);
        }
      } else if (hasEntries && !isDisplayStackContainer) {
        togglePath(path);
      }
    };

    // Hide 'name' inside virtual panel node bodies (avoid duplication)
    // also hide 'id' and/or 'visible' based on env flags
    const isVirtualNode = looksLikeVirtualPanelNode(value);
    const keys = isArray
      ? (value as any[]).map((_, i) => String(i))
      : Object.keys(value as object).filter((k) => {
          if (!isVirtualNode) return true;
          if (k === 'name') return false;
          // hide either identifier key if SHOW_IDS disabled
          if (!SHOW_IDS && (k === 'id' || k === 'panel')) return false;
          if (!SHOW_VIS && k === 'visible') return false;
          return true;
        });

    // 'children' container renders items directly (no own row)
    if (isChildrenContainer) {
      return (
        <>
          {expanded &&
            keys.map((k) => {
              const childPath = `${path}.${k}`;
              const childVal = (value as any[])[Number(k)];

              const childLabel = looksLikeVirtualPanelNode(childVal)
                ? formatChildLabel(childVal, k)
                : `[${k}]`;

              return (
                <Branch
                  key={childPath}
                  label={childLabel}
                  value={childVal}
                  depth={depth} // same depth (no 'children' row shown)
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
          open={
            hasEntries
              ? isPanelArrayItem
                ? (value as any)?.visible === true
                : expanded
              : undefined
          }
          clickable={isPanelArrayItem || (hasEntries && !isDisplayStackContainer)}
          onClick={onRowClick}
          dense={dense}
        />
        {(isPanelArrayItem ? (value as any)?.visible === true : expanded) &&
          keys.map((k) => {
            const childPath = `${path}.${k}`;
            const childVal = isArray
              ? (value as any[])[Number(k)]
              : (value as any)[k];

            let childLabel = isArray ? `[${k}]` : k;

            if (
              isArray &&
              PANEL_ARRAY_LABELS.has(label) &&
              looksLikeVirtualPanelNode(childVal)
            ) {
              childLabel = formatChildLabel(childVal, k);
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
  const lineClass = dense
    ? 'flex items-center leading-tight'
    : 'flex items-center leading-6';
  const enumForKey = enumRegistry[label];

  const content =
    enumForKey && typeof value === 'number' ? (
      <>
        {label === 'id' && !SHOW_IDS ? null : (
          <>
            {`${label}(${value}): `}
            <span className="text-[#5981F3]">
              {typeof enumForKey[value] === 'string'
                ? enumForKey[value]
                : `[${value}]`}
            </span>
          </>
        )}
      </>
    ) : label === 'visible' && !SHOW_VIS ? null : (
      <>
        {`${label}: `}
        <span className="text-[#5981F3]">{quoteIfString(value)}</span>
      </>
    );

  if (content === null) return null;

  return (
    <div className={`font-mono ${lineClass} text-slate-200 m-0 p-0`}>
      <span className="whitespace-pre select-none">{'  '.repeat(depth)}</span>
      <span>{content}</span>
    </div>
  );
};

export default Branch;
