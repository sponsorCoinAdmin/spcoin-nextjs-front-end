// File: lib/context/hooks/useActiveDisplay.ts
import { useCallback } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

// Overlays behave like a radio group
const OVERLAY_GROUP: SP_COIN_DISPLAY[] = [
  SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL,
  SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL,
  SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
];

const TRADING = SP_COIN_DISPLAY.TRADING_STATION_PANEL;

// DFS
function findNode(root: MainPanelNode | undefined, panel: SP_COIN_DISPLAY): any | null {
  if (!root) return null;
  if (root.panel === panel) return root;
  for (const c of root.children || []) {
    const n = findNode(c as any, panel);
    if (n) return n;
  }
  return null;
}

function clone<T>(o: T): T {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

function setVisible(root: MainPanelNode, panel: SP_COIN_DISPLAY, visible: boolean) {
  const n = findNode(root, panel);
  if (n) n.visible = visible;
}

export function useActiveDisplay() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const activeDisplay = exchangeContext.settings.activeDisplay;

  /**
   * Legacy focus setter + radio visibility sync for the new panel tree.
   * - If switching to TRADING: hide all overlays, show TRADING.
   * - If switching to an overlay: show that overlay, hide other overlays, hide TRADING.
   * - Else: just mark the target visible (don’t hide others).
   */
  const setActiveDisplay = useCallback(
    (value: SP_COIN_DISPLAY) => {
      setExchangeContext((prev) => {
        const root = prev.settings?.mainPanelNode as MainPanelNode | undefined;

        if (!root) {
          // fallback: just keep legacy working
          return {
            ...prev,
            settings: {
              ...prev.settings,
              activeDisplay: value,
            },
          };
        }

        const nextRoot = clone(root);

        if (value === TRADING) {
          // close overlays
          OVERLAY_GROUP.forEach((p) => setVisible(nextRoot, p, false));
          setVisible(nextRoot, TRADING, true);
        } else if (OVERLAY_GROUP.includes(value)) {
          // open one overlay (radio behavior)
          OVERLAY_GROUP.forEach((p) => setVisible(nextRoot, p, p === value));
          setVisible(nextRoot, TRADING, false);
        } else {
          // non-overlay panel: simply ensure it’s visible
          setVisible(nextRoot, value, true);
        }

        return {
          ...prev,
          settings: {
            ...prev.settings,
            activeDisplay: value,
            mainPanelNode: nextRoot,
          },
        };
      }, 'useActiveDisplay:setActiveDisplay(radio)');
    },
    [setExchangeContext]
  );

  return {
    activeDisplay,
    setActiveDisplay,
  };
}
