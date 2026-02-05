// File: @/app/(menu)/Test/Tabs/ExchangeContext/components/Tree/Branch.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import Row from './Row';
import { quoteIfString } from '../../utils/object';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { MAIN_OVERLAY_GROUP, NON_INDEXED_PANELS } from '@/lib/structure/exchangeContext/registry/panelRegistry';

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
const looksLikeVirtualPanelNode = (v: any) => v && getVirtualId(v) != null && 'visible' in v;

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

  const name = typeof v?.name === 'string' && v.name.trim().length ? String(v.name) : 'N/A';

  return `${idxLabel} { id: ${safeId}, name: "${name}" }`;
}

/**
 * ✅ GUI-only transformation:
 * Persisted structure is:
 *   MAIN_TRADING_PANEL
 *     TRADE_CONTAINER_HEADER
 *       (overlays...)
 *
 * But the GUI should show overlays as siblings of TRADE_CONTAINER_HEADER under MAIN_TRADING_PANEL:
 *   MAIN_TRADING_PANEL
 *     TRADE_CONTAINER_HEADER
 *     (overlays...)
 *
 * This does NOT change persisted state — only how the tree is rendered.
 */
function hoistTradeHeaderChildrenForGui(mainNode: any): any {
  if (!looksLikeVirtualPanelNode(mainNode)) return mainNode;

  const mainId = getVirtualId(mainNode);
  if (Number(mainId) !== Number(SP_COIN_DISPLAY.MAIN_TRADING_PANEL)) return mainNode;

  const mainChildren: any[] = Array.isArray(mainNode?.children) ? mainNode.children : [];
  if (!mainChildren.length) return mainNode;

  // Find TRADE_CONTAINER_HEADER inside MAIN_TRADING_PANEL.children
  const idx = mainChildren.findIndex(
    (c) =>
      looksLikeVirtualPanelNode(c) && Number(getVirtualId(c)) === Number(SP_COIN_DISPLAY.TRADE_CONTAINER_HEADER),
  );
  if (idx < 0) return mainNode;

  const tradeHeader = mainChildren[idx];
  const tradeKids: any[] = Array.isArray(tradeHeader?.children) ? tradeHeader.children : [];

  // If it has no kids, nothing to hoist
  if (!tradeKids.length) return mainNode;

  // Clone TRADE_CONTAINER_HEADER but strip its children
  const tradeHeaderLeaf = { ...tradeHeader, children: [] };

  // MAIN children become: [ ...before, tradeHeaderLeaf, ...tradeKids, ...after ]
  const nextChildren = [
    ...mainChildren.slice(0, idx),
    tradeHeaderLeaf,
    ...tradeKids,
    ...mainChildren.slice(idx + 1),
  ];

  return { ...mainNode, children: nextChildren };
}

// ✅ ACCOUNT_PANEL “mode” nodes should behave like a radio group *when ACCOUNT_PANEL is visible*
const ACCOUNT_PANEL_MODES: readonly SP_COIN_DISPLAY[] = [
  SP_COIN_DISPLAY.ACTIVE_SPONSOR,
  SP_COIN_DISPLAY.ACTIVE_RECIPIENT,
  SP_COIN_DISPLAY.ACTIVE_AGENT,
] as const;

const isAccountPanelMode = (id: number): id is (typeof ACCOUNT_PANEL_MODES)[number] =>
  ACCOUNT_PANEL_MODES.some((m) => Number(m) === Number(id));

const Branch: React.FC<BranchProps> = ({ label, value, depth, path, exp, togglePath, enumRegistry, dense }) => {
  /**
   * ✅ Contract:
   * Tree only calls openPanel / closePanel.
   * Stack membership + visibility semantics are handled inside usePanelTree.
   */
  const { openPanel, closePanel, isVisible } = usePanelTree();

  const isArray = Array.isArray(value);

  /**
   * ✅ GUI-only shaping of spCoinPanelTree (roots array).
   * If this Branch node is the "spCoinPanelTree" array, transform only the MAIN_TRADING_PANEL root.
   */
  const guiValue =
    isArray && label === 'spCoinPanelTree' ? (value as any[]).map((n) => hoistTradeHeaderChildrenForGui(n)) : value;

  const isObject = guiValue !== null && typeof guiValue === 'object' && !isArray;
  const isBranch = isArray || isObject;

  // dot-path classifiers for *virtual* panel nodes
  const isPanelArrayItem = /(\.(spCoinPanelTree|children)\.\d+$)/.test(path) && looksLikeVirtualPanelNode(guiValue);

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
      const vis = !!(guiValue as any)?.visible;
      if (lastVisibleRef.current !== vis) {
        lastVisibleRef.current = vis;
        if (vis) {
          ensureOpen(path);
          ensureOpen(`${path}.children`);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPanelArrayItem, (guiValue as any)?.visible, path, label]);

  // ✅ Render displayStack item rows as a single line (non-toggleable)
  if (isDisplayStackItem) {
    const lineClass = dense ? 'leading-tight' : 'leading-6';
    const text = formatDisplayStackItem(label, guiValue);

    return (
      <div className={`font-mono flex items-center ${lineClass} text-slate-200 m-0 p-0`}>
        <span className="whitespace-pre select-none">{'  '.repeat(depth)}</span>
        <span className="text-[#5981F3]">{text}</span>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // BRANCH NODES (objects & arrays)
  // ──────────────────────────────────────────────────────────────
  if (isBranch) {
    const numEntries = isArray ? (guiValue as any[]).length : Object.keys(guiValue as object).length;
    const hasEntries = numEntries > 0;

    // Expanded state:
    let expanded = false;
    if (hasEntries) {
      if (isPanelArrayItem) {
        expanded = (guiValue as any)?.visible === true;
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
        const panelId = getVirtualId(guiValue);
        if (panelId == null) return;

        const currentlyVisible = !!(guiValue as any).visible;
        const invoker = 'Branch:onRowClick(tree)';

        // If currently visible, clicking acts as a toggle OFF (allows "none" selected)
        if (currentlyVisible) {
          closePanel(panelId as any, invoker);
          return;
        }

        // ✅ ACCOUNT_PANEL mode radio behavior:
        // If ACCOUNT_PANEL is visible, then ACTIVE_SPONSOR/ACTIVE_RECIPIENT/ACTIVE_AGENT are treated as a radio group here.
        // This is context-aware and does NOT open ACCOUNT_LIST_REWARDS_PANEL.
        const accountPanelVisible = isVisible(SP_COIN_DISPLAY.ACCOUNT_PANEL);
        if (accountPanelVisible && isAccountPanelMode(panelId)) {
          for (const m of ACCOUNT_PANEL_MODES) {
            if (Number(m) !== Number(panelId)) {
              closePanel(m as any, 'TreePanel:accountPanelMode:closeOther');
            }
          }
          openPanel(panelId as any, 'TreePanel:accountPanelMode:openSelected');
          ensureOpen(path);
          ensureOpen(`${path}.children`);
          return;
        }

        // ✅ default behavior (no rewards helper logic)
        openPanel(panelId as any, invoker);
        ensureOpen(path);
        ensureOpen(`${path}.children`);
      } else if (hasEntries && !isDisplayStackContainer) {
        togglePath(path);
      }
    };

    // Hide 'name' inside virtual panel node bodies (avoid duplication)
    // also hide 'id' and/or 'visible' based on env flags
    const isVirtualNode = looksLikeVirtualPanelNode(guiValue);
    const keys = isArray
      ? (guiValue as any[]).map((_, i) => String(i))
      : Object.keys(guiValue as object).filter((k) => {
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
              const childVal = (guiValue as any[])[Number(k)];

              const childLabel = looksLikeVirtualPanelNode(childVal) ? formatChildLabel(childVal, k) : `[${k}]`;

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
          open={hasEntries ? (isPanelArrayItem ? (guiValue as any)?.visible === true : expanded) : undefined}
          clickable={isPanelArrayItem || (hasEntries && !isDisplayStackContainer)}
          onClick={onRowClick}
          dense={dense}
        />
        {(isPanelArrayItem ? (guiValue as any)?.visible === true : expanded) &&
          keys.map((k) => {
            const childPath = `${path}.${k}`;
            const childVal = isArray ? (guiValue as any[])[Number(k)] : (guiValue as any)[k];

            let childLabel = isArray ? `[${k}]` : k;

            if (isArray && PANEL_ARRAY_LABELS.has(label) && looksLikeVirtualPanelNode(childVal)) {
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
  const lineClass = dense ? 'flex items-center leading-tight' : 'flex items-center leading-6';
  const enumForKey = enumRegistry[label];

  const content =
    enumForKey && typeof guiValue === 'number' ? (
      <>
        {label === 'id' && !SHOW_IDS ? null : (
          <>
            {`${label}(${guiValue}): `}
            <span className="text-[#5981F3]">
              {typeof enumForKey[guiValue] === 'string' ? enumForKey[guiValue] : `[${guiValue}]`}
            </span>
          </>
        )}
      </>
    ) : label === 'visible' && !SHOW_VIS ? null : (
      <>
        {`${label}: `}
        <span className="text-[#5981F3]">{quoteIfString(guiValue)}</span>
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
