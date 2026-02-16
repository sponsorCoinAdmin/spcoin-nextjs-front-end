// File: @/lib/context/hooks/ExchangeContext/hooks/useProviderWatchers.ts

import { useEffect, useRef } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type {
  ExchangeContext as ExchangeContextTypeOnly,
  spCoinAccount,
} from '@/lib/structure';
import type { SpCoinPanelTree } from '@/lib/structure/exchangeContext/types/PanelNode';
import { resolveNetworkElement } from '@/lib/utils/network';
import { MAIN_RADIO_OVERLAY_PANELS } from '@/lib/structure/exchangeContext/registry/panelRegistry';

// ✅ SSOT account hydration
import { hydrateAccountFromAddress } from '@/lib/context/helpers/accountHydration';

/* ------------------------------- utils -------------------------------- */

const lower = (a?: string | Address) =>
  a ? (a as string).toLowerCase() : undefined;

const shallowEqual = <T extends Record<string, any>>(a?: T, b?: T) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
};

const clone = <T,>(o: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(o)
    : JSON.parse(JSON.stringify(o));

/**
 * "Hydrated enough" = account.json likely applied.
 * Prevents duplicate hydration on boot (initExchangeContext already hydrated)
 * and avoids re-fetching on wagmi churn when address is unchanged.
 */
const isHydratedAccount = (a?: spCoinAccount) => {
  if (!a?.address) return false;
  return Boolean(
    (a.name && a.name.trim().length) ||
      (a.symbol && a.symbol.trim().length) ||
      (a.website && a.website.trim().length) ||
      (a.description && a.description.trim().length),
  );
};

/* ----------------------- Flat panel visibility helpers ---------------------- */

function anyVisible(panels: SpCoinPanelTree, ids: SP_COIN_DISPLAY[]): boolean {
  return panels.some(
    (n) => ids.includes(n.panel as SP_COIN_DISPLAY) && !!n.visible,
  );
}

function setOverlayVisible(
  panels: SpCoinPanelTree,
  targetId: SP_COIN_DISPLAY,
): SpCoinPanelTree {
  const next = clone(panels);
  for (const n of next) {
    if (MAIN_RADIO_OVERLAY_PANELS.includes(n.panel as SP_COIN_DISPLAY)) {
      n.visible = (n.panel as SP_COIN_DISPLAY) === targetId;
    }
  }
  return next;
}

/* -------------------------------- types ------------------------------- */

type SetExchange = (
  updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
  hookName?: string,
) => void;

type Params = {
  contextState?: ExchangeContextTypeOnly;
  setExchangeContext: SetExchange;
  wagmiChainId?: number;
  appChainId?: number;
  isConnected: boolean;
  address?: string | undefined;
  accountStatus?: string;
};

/* --------------------------- main hook logic --------------------------- */

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
  const prevAccountRef = useRef<{
    address?: string;
    status?: string;
    connected?: boolean;
  }>();
  const prevTokensRef = useRef<{ sell?: string; buy?: string }>();

  const isFirstWagmiRunRef = useRef(true);
  const isFirstCtxRunRef = useRef(true);

  /* ---------------- wagmi chain watcher (wallet-driven) ---------------- */
  useEffect(() => {
    if (!contextState) return;
    if (!isConnected || wagmiChainId == null) return;

    const prevWagmi = prevWagmiChainRef.current;
    const nextWagmi = wagmiChainId;

    if (isFirstWagmiRunRef.current) {
      isFirstWagmiRunRef.current = false;
      prevWagmiChainRef.current = nextWagmi;
      return;
    }

    if (prevWagmi === nextWagmi) return;

    setExchangeContext(
      (prevCtx) => {
        const next = clone(prevCtx);
        const currentCtxChain = next.network?.chainId;

        next.network = resolveNetworkElement(nextWagmi, next.network);

        if (currentCtxChain !== nextWagmi) {
          next.tradeData.sellTokenContract = undefined;
          next.tradeData.buyTokenContract = undefined;
          next.tradeData.previewTokenContract = undefined;
        }
        return next;
      },
      'watcher:wagmiChain',
    );

    prevWagmiChainRef.current = nextWagmi;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [isConnected, wagmiChainId, contextState, setExchangeContext]);

  /* --------------- context/app chain watcher (UI/local) ---------------- */
  useEffect(() => {
    const ctxChain =
      typeof appChainId === 'number'
        ? appChainId
        : contextState?.network?.chainId;

    if (!contextState) return;
    if (ctxChain == null) return;

    if (isFirstCtxRunRef.current) {
      isFirstCtxRunRef.current = false;
      prevCtxChainRef.current = ctxChain;
      return;
    }

    const prevCtxChain = prevCtxChainRef.current ?? ctxChain;
    if (ctxChain === prevCtxChain) return;

    const isLocalChange =
      !isConnected || (wagmiChainId != null && ctxChain !== wagmiChainId);

    if (!isLocalChange) {
      prevCtxChainRef.current = ctxChain;
      return;
    }

    setExchangeContext(
      (prevCtx) => {
        const next = clone(prevCtx);
        const currentCtxChain = next.network?.chainId;

        next.network = resolveNetworkElement(ctxChain, next.network);

        if (currentCtxChain !== ctxChain) {
          next.tradeData.sellTokenContract = undefined;
          next.tradeData.buyTokenContract = undefined;
          next.tradeData.previewTokenContract = undefined;
        }
        return next;
      },
      'watcher:contextChain',
    );

    prevCtxChainRef.current = ctxChain;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [appChainId, contextState, isConnected, wagmiChainId, setExchangeContext]);

  /* ------------------- account watcher (deduped hydration) ------------------ */
  useEffect(() => {
    if (!contextState) return;

    const prev = prevAccountRef.current;
    const nextSlice = {
      address: address ?? undefined,
      status: accountStatus,
      connected: isConnected,
    };
    if (shallowEqual(prev, nextSlice)) return;

    const nextAddr = nextSlice.address?.trim();
    const ctxAcct = contextState.accounts?.activeAccount;

    // ✅ Stop duplicate boot hydration:
    // initExchangeContext already hydrated this address -> don't re-fetch.
    if (
      nextAddr &&
      lower(ctxAcct?.address) === lower(nextAddr) &&
      isHydratedAccount(ctxAcct)
    ) {
      prevAccountRef.current = nextSlice;
      return;
    }

    // ✅ On disconnect, do NOT clear activeAccount (existing behavior)
    let cancelled = false;

    (async () => {
      if (!nextAddr) return;

      // ✅ Preserve balance only if SAME address (avoid smearing)
      const existingBalance =
        lower(ctxAcct?.address) === lower(nextAddr) ? (ctxAcct?.balance ?? 0n) : 0n;

      const hydrated = await hydrateAccountFromAddress(nextAddr as Address, {
        balance: existingBalance,
      });

      if (cancelled) return;

      setExchangeContext(
        (prevCtx) => {
          const next = clone(prevCtx);

          // ✅ Last-write-wins: if address changed mid-fetch, ignore this write
          const currentAddr = (address ?? '').trim();
          if (!currentAddr || lower(currentAddr) !== lower(nextAddr)) return next;

          next.accounts.activeAccount = hydrated;

          // Preserve previous behavior: reset token balances on account change
          if (next.tradeData.sellTokenContract)
            next.tradeData.sellTokenContract.balance = 0n;
          if (next.tradeData.buyTokenContract)
            next.tradeData.buyTokenContract.balance = 0n;

          return next;
        },
        'watcher:account:hydrate',
      );
    })();

    prevAccountRef.current = nextSlice;

    return () => {
      cancelled = true;
    };
    // NOTE: include `address` so the stale-write guard sees latest
  }, [address, accountStatus, isConnected, contextState, setExchangeContext]);

  /* ---------- tokens watcher (dedupe + auto-close selection UI) --------- */
  useEffect(() => {
    if (!contextState) return;

    const sellAddr = lower(contextState.tradeData.sellTokenContract?.address);
    const buyAddr = lower(contextState.tradeData.buyTokenContract?.address);

    const prev = prevTokensRef.current;
    const nextSlice = { sell: sellAddr, buy: buyAddr };
    if (shallowEqual(prev, nextSlice)) return;

    // A) Prevent duplicate token selection
    if (sellAddr && buyAddr && sellAddr === buyAddr) {
      setExchangeContext(
        (prevCtx) => {
          const next = clone(prevCtx);
          next.tradeData.buyTokenContract = undefined;
          return next;
        },
        'watcher:tokens:dedupe',
      );
    }

    // B) Auto-close selection overlay when a token is committed
    const root = contextState.settings?.spCoinPanelTree as
      | SpCoinPanelTree
      | undefined;

    const selectOpen = root
      ? anyVisible(root, [SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL])
      : false;

    if ((sellAddr || buyAddr) && selectOpen && root) {
      setExchangeContext(
        (prevCtx) => {
          const next = clone(prevCtx);
          next.settings.spCoinPanelTree = setOverlayVisible(
            next.settings.spCoinPanelTree as SpCoinPanelTree,
            SP_COIN_DISPLAY.TRADING_STATION_PANEL,
          );
          return next;
        },
        'watcher:tokens:autoClose',
      );
    }

    prevTokensRef.current = nextSlice;
  }, [
    contextState,
    contextState?.tradeData.sellTokenContract?.address,
    contextState?.tradeData.buyTokenContract?.address,
    contextState?.settings?.spCoinPanelTree,
    setExchangeContext,
  ]);
}
