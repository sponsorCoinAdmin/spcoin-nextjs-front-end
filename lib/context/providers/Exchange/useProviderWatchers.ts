// File: lib/context/providers/useProviderWatchers.ts

import { useEffect, useRef } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type {
  ExchangeContext as ExchangeContextTypeOnly,
  WalletAccount,
} from '@/lib/structure';
import type { MainPanelNode, PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { resolveNetworkElement } from '@/lib/context/helpers/NetworkHelpers';

const lower = (a?: string | Address) => (a ? (a as string).toLowerCase() : undefined);
const shallowEqual = <T extends Record<string, any>>(a?: T, b?: T) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
};

type SetExchange = (
  updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
  hookName?: string
) => void;

type Params = {
  contextState?: ExchangeContextTypeOnly;
  setExchangeContext: SetExchange;
  /** Wallet (wagmi) chain id — when connected */
  wagmiChainId?: number;
  /** App-first chain id (preferred source of truth) */
  appChainId?: number;
  isConnected: boolean;
  address?: string | undefined;
  accountStatus?: string;
};

/* -------------------------- Panel tree helpers -------------------------- */

// Radio group for main overlays
const MAIN_OVERLAY_GROUP: SP_COIN_DISPLAY[] = [
  SP_COIN_DISPLAY.TRADING_STATION_PANEL,
  SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST,
  SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST,
  SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST,
  SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST,
  SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
  SP_COIN_DISPLAY.SPONSORSHIPS_CONFIG_PANEL,
];

function clone<T>(o: T): T {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

function visitTree(node: PanelNode, fn: (n: PanelNode) => void) {
  fn(node);
  if (Array.isArray(node.children)) {
    for (const c of node.children) visitTree(c, fn);
  }
}

function anyVisible(root: MainPanelNode, ids: SP_COIN_DISPLAY[]): boolean {
  let open = false;
  visitTree(root, (n) => {
    if (ids.includes(n.panel as SP_COIN_DISPLAY) && n.visible) open = true;
  });
  return open;
}

/** Set radio visibility across MAIN_OVERLAY_GROUP, turning on only `targetId`. */
function setOverlayVisible(root: MainPanelNode, targetId: SP_COIN_DISPLAY): MainPanelNode {
  const next = clone(root);
  visitTree(next, (n) => {
    if (MAIN_OVERLAY_GROUP.includes(n.panel as SP_COIN_DISPLAY)) {
      n.visible = (n.panel as SP_COIN_DISPLAY) === targetId;
    }
  });
  return next;
}

/* ----------------------------------------------------------------------- */

export function useProviderWatchers({
  contextState,
  setExchangeContext,
  wagmiChainId,
  appChainId,
  isConnected,
  address,
  accountStatus,
}: Params) {
  const prevWagmiChainRef = useRef<number | undefined>();
  const prevCtxChainRef = useRef<number | undefined>();
  const prevAccountRef = useRef<{ address?: string; status?: string; connected?: boolean }>();
  const prevTokensRef = useRef<{ sell?: string; buy?: string }>();

  // CONNECTED: wagmi chain watcher → hydrate full NetworkElement + clear tokens
  useEffect(() => {
    if (!contextState) return;

    if (!isConnected) {
      prevWagmiChainRef.current = wagmiChainId ?? undefined;
      return;
    }

    const prevWagmi = prevWagmiChainRef.current;
    const nextWagmi = wagmiChainId ?? 0;
    if (prevWagmi === nextWagmi) return;

    setExchangeContext((prevCtx) => {
      const next = structuredClone(prevCtx);

      // Overwrite chain-derived fields when chain changes
      next.network = resolveNetworkElement(nextWagmi, next.network);

      // Clear cross-chain selections
      next.tradeData.sellTokenContract = undefined;
      next.tradeData.buyTokenContract = undefined;

      return next;
    }, 'watcher:wagmiChain(connected):hydrateNetwork+clearTokens');

    prevWagmiChainRef.current = nextWagmi;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [isConnected, wagmiChainId, contextState, setExchangeContext]);

  // DISCONNECTED / UI-driven: context/app chain watcher → hydrate network + clear tokens
  useEffect(() => {
    if (!contextState) return;

    // prefer appChainId, fall back to contextState.network.chainId
    const ctxChain =
      (typeof appChainId === 'number' ? appChainId : contextState.network?.chainId) ?? 0;

    const prevCtxChain = prevCtxChainRef.current ?? 0;
    if (ctxChain === prevCtxChain) return;

    // Local change if:
    //  - not connected, or
    //  - selected app/ctx chain differs from current wallet chain
    const isLocalChange = !isConnected || ctxChain !== (wagmiChainId ?? 0);
    if (!isLocalChange) {
      prevCtxChainRef.current = ctxChain;
      return;
    }

    setExchangeContext((prevCtx) => {
      const next = structuredClone(prevCtx);

      // Hydrate full NetworkElement for local chain selection
      next.network = resolveNetworkElement(ctxChain, next.network);

      next.tradeData.sellTokenContract = undefined;
      next.tradeData.buyTokenContract = undefined;

      return next;
    }, 'watcher:contextChain(local):hydrateNetwork+clearTokens');

    prevCtxChainRef.current = ctxChain;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [
    appChainId,
    contextState?.network?.chainId,
    isConnected,
    wagmiChainId,
    setExchangeContext,
    contextState,
  ]);

  // Account watcher — reflect connected account and clear balances on change
  useEffect(() => {
    if (!contextState) return;

    const prev = prevAccountRef.current;
    const nextSlice = {
      address: address ?? undefined,
      status: accountStatus,
      connected: isConnected,
    };
    if (shallowEqual(prev, nextSlice)) return;

    setExchangeContext((prevCtx) => {
      const next = structuredClone(prevCtx);

      if (nextSlice.address && isConnected) {
        // Wallet connected → hydrate connectedAccount with real address
        const current = next.accounts.connectedAccount ?? ({} as WalletAccount);
        next.accounts.connectedAccount = {
          ...current,
          address: nextSlice.address as Address,
        };
      } else {
        // Wallet disconnected → clear connectedAccount
        next.accounts.connectedAccount = undefined as any;
      }

      if (next.tradeData.sellTokenContract) next.tradeData.sellTokenContract.balance = 0n;
      if (next.tradeData.buyTokenContract) next.tradeData.buyTokenContract.balance = 0n;

      return next;
    }, 'watcher:account');

    prevAccountRef.current = nextSlice;
  }, [address, accountStatus, isConnected, contextState, setExchangeContext]);

  // Token watcher — prevent duplicates & auto-close selection panel(s)
  useEffect(() => {
    if (!contextState) return;

    const sellAddr = lower(contextState.tradeData.sellTokenContract?.address);
    const buyAddr = lower(contextState.tradeData.buyTokenContract?.address);

    const prev = prevTokensRef.current;
    const nextSlice = { sell: sellAddr, buy: buyAddr };
    if (shallowEqual(prev, nextSlice)) return;

    // A) Duplicate prevention
    if (sellAddr && buyAddr && sellAddr === buyAddr) {
      setExchangeContext((prevCtx) => {
        const next = structuredClone(prevCtx);
        next.tradeData.buyTokenContract = undefined;
        return next;
      }, 'watcher:tokens:dedupe');
    }

    // B) Auto-close selection overlay → switch to TRADING when a token is committed
    const root = contextState.settings?.mainPanelNode as MainPanelNode | undefined;
    const selectOpen = root
      ? anyVisible(root, [
          SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST,
          SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST,
        ])
      : false;

    if ((sellAddr || buyAddr) && selectOpen && root) {
      setExchangeContext((prevCtx) => {
        const next = structuredClone(prevCtx);
        next.settings.mainPanelNode = setOverlayVisible(
          next.settings.mainPanelNode as MainPanelNode,
          SP_COIN_DISPLAY.TRADING_STATION_PANEL
        );
        return next;
      }, 'watcher:tokens:autoClose');
    }

    prevTokensRef.current = nextSlice;
  }, [
    contextState,
    contextState?.tradeData.sellTokenContract?.address,
    contextState?.tradeData.buyTokenContract?.address,
    contextState?.settings?.mainPanelNode, // re-run when panel tree changes
    setExchangeContext,
  ]);
}
