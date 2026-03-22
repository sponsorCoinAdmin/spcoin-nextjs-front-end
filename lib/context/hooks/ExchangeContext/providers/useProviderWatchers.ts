// File: lib/context/hooks/ExchangeContext/providers/useProviderWatchers.ts

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
import { getPreferredSpCoinContractAddress } from '@/lib/spCoin/coreUtils';

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

type SpCoinContractMetaData = {
  version: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSypply: string;
  inflationRate: number;
  recipientRateRange: [number, number];
  agentRateRange: [number, number];
};

function normalizeRateRangeTuple(value: unknown): [number, number] {
  if (Array.isArray(value)) {
    return [Number(value[0] ?? 0), Number(value[1] ?? 0)];
  }
  return [0, Number(value ?? 0)];
}

function getPersistedSpCoinAccessAddress(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem('spCoinAccess');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as {
      deployedContractAddress?: string;
      deploymentPublicKey?: string;
    };
    const nextAddress = String(
      parsed?.deployedContractAddress ?? parsed?.deploymentPublicKey ?? '',
    ).trim();
    return /^0x[a-fA-F0-9]{40}$/.test(nextAddress) ? nextAddress : undefined;
  } catch {
    return undefined;
  }
}

function getPersistedSponsorCoinLabAddress(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem('spCoinLabKey');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as {
      contractAddress?: string;
    };
    const nextAddress = String(parsed?.contractAddress ?? '').trim();
    return /^0x[a-fA-F0-9]{40}$/.test(nextAddress) ? nextAddress : undefined;
  } catch {
    return undefined;
  }
}

function getPersistedSpCoinAccessContractSeed():
  | {
      version: string;
      name: string;
      symbol: string;
      decimals: number;
    }
  | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem('spCoinAccess');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as {
      deploymentName?: string;
      deploymentSymbol?: string;
      deploymentDecimals?: string;
      deploymentVersion?: string;
    };
    const version = String(parsed?.deploymentVersion ?? '').trim();
    const name = String(parsed?.deploymentName ?? '').trim();
    const symbol = String(parsed?.deploymentSymbol ?? '').trim();
    const decimals = Number(parsed?.deploymentDecimals ?? 0);
    if (!version && !name && !symbol && !Number.isFinite(decimals)) {
      return undefined;
    }
    return {
      version,
      name,
      symbol,
      decimals: Number.isFinite(decimals) ? decimals : 0,
    };
  } catch {
    return undefined;
  }
}

function getPersistedSponsorCoinLabContractSeed():
  | {
      version: string;
      name: string;
      symbol: string;
    }
  | undefined {
  if (typeof window === 'undefined') return undefined;
  const normalizeSpCoinVersion = (value: unknown): string => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (!raw.includes('::')) return raw;
    return String(raw.split('::')[1] ?? '').trim();
  };
  try {
    const raw = window.localStorage.getItem('spCoinLabKey');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as {
      selectedSponsorCoinVersion?: string;
    };
    const version = normalizeSpCoinVersion(parsed?.selectedSponsorCoinVersion);
    if (!version) return undefined;
    return {
      version,
      name: `Sponsor Coin V${version}`,
      symbol: `SPCOIN_V${version}`,
    };
  } catch {
    return undefined;
  }
}

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
  const spCoinMetaKeyRef = useRef<string>('');

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

  /* -------------------- spCoin contract metadata hydration ------------------- */
  useEffect(() => {
    if (!contextState) return;

    const currentMeta = contextState.settings?.spCoinContract;
    const currentName = String(currentMeta?.name ?? '').trim();
    const currentVersion = String(currentMeta?.version ?? '').trim();
    const currentSymbol = String(currentMeta?.symbol ?? '').trim();
    const persistedLabSeed = getPersistedSponsorCoinLabContractSeed();
    const persistedAccessSeed = getPersistedSpCoinAccessContractSeed();
    const persistedSeed = persistedLabSeed
      ? {
          version: persistedLabSeed.version,
          name: persistedLabSeed.name,
          symbol: persistedLabSeed.symbol,
          decimals: persistedAccessSeed?.decimals ?? 18,
        }
      : persistedAccessSeed;

    const shouldSeedFromPersistedSource = persistedLabSeed
      ? Boolean(
          persistedSeed &&
            (currentName !== persistedSeed.name ||
              currentVersion !== persistedSeed.version ||
              currentSymbol !== persistedSeed.symbol),
        )
      : Boolean((currentName.length === 0 || currentVersion.length === 0) && persistedSeed);

    if (shouldSeedFromPersistedSource && persistedSeed) {
      setExchangeContext(
        (prevCtx) => {
          const next = clone(prevCtx);
          const prevContract = next.settings?.spCoinContract;
          const prevName = String(prevContract?.name ?? '').trim();
          const prevVersion = String(prevContract?.version ?? '').trim();
          const prevSymbol = String(prevContract?.symbol ?? '').trim();
          if (
            persistedLabSeed &&
            prevName === persistedSeed.name &&
            prevVersion === persistedSeed.version &&
            prevSymbol === persistedSeed.symbol
          ) {
            return next;
          }
          if (!persistedLabSeed && prevName.length > 0 && prevVersion.length > 0) return next;
          next.settings = next.settings ?? ({} as any);
          next.settings.spCoinContract = {
            version: persistedSeed.version,
            name: persistedSeed.name,
            symbol: persistedSeed.symbol,
            decimals: persistedSeed.decimals,
            totalSypply: String(prevContract?.totalSypply ?? '').trim(),
            inflationRate: Number(prevContract?.inflationRate ?? 0),
            recipientRateRange: normalizeRateRangeTuple(prevContract?.recipientRateRange),
            agentRateRange: normalizeRateRangeTuple(prevContract?.agentRateRange),
          };
          return next;
        },
        'watcher:spCoinMetaData:seedFromStorage',
      );
    }

    const appChainIdNum = Number(
      contextState.network?.appChainId ?? contextState.network?.chainId ?? 0,
    );
    const persistedLabAddress = getPersistedSponsorCoinLabAddress();
    const persistedSpCoinAddress = getPersistedSpCoinAccessAddress();
    const preferredTradeSpCoinAddress = getPreferredSpCoinContractAddress(
      appChainIdNum,
      contextState.tradeData,
    );
    const targetAddress =
      persistedLabAddress ??
      persistedSpCoinAddress ??
      preferredTradeSpCoinAddress;
    if (!targetAddress) return;

    const metaKey = `${appChainIdNum}:${targetAddress.toLowerCase()}`;
    const shouldHydrate =
      currentName.length === 0 ||
      currentVersion.length === 0 ||
      spCoinMetaKeyRef.current !== metaKey;

    if (!shouldHydrate) return;

    let cancelled = false;
    spCoinMetaKeyRef.current = metaKey;

    (async () => {
      try {
        const params = new URLSearchParams({
          deploymentPublicKey: targetAddress,
          deploymentChainId: String(appChainIdNum),
          includeMetadata: 'true',
        });
        const response = await fetch(`/api/spCoin/access-manager?${params.toString()}`, {
          method: 'GET',
        });
        const data = (await response.json()) as {
          ok?: boolean;
          spCoinMetaData?: SpCoinContractMetaData;
        };
        if (!response.ok || !data.ok || !data.spCoinMetaData || cancelled) return;

        setExchangeContext(
          (prevCtx) => {
            const next = clone(prevCtx);
            next.settings = next.settings ?? ({} as any);
            next.settings.spCoinContract = {
              version: String(data.spCoinMetaData?.version ?? '').trim(),
              name: String(data.spCoinMetaData?.name ?? '').trim(),
              symbol: String(data.spCoinMetaData?.symbol ?? '').trim(),
              decimals: Number(data.spCoinMetaData?.decimals ?? 0),
              totalSypply: String(data.spCoinMetaData?.totalSypply ?? '').trim(),
              inflationRate: Number(data.spCoinMetaData?.inflationRate ?? 0),
              recipientRateRange: normalizeRateRangeTuple(data.spCoinMetaData?.recipientRateRange),
              agentRateRange: normalizeRateRangeTuple(data.spCoinMetaData?.agentRateRange),
            };
            return next;
          },
          'watcher:spCoinMetaData:hydrate',
        );
      } catch {
        // Ignore transient metadata hydration errors and retry on the next key change.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    contextState,
    contextState?.network?.appChainId,
    contextState?.network?.chainId,
    contextState?.tradeData?.buyTokenContract?.address,
    contextState?.tradeData?.sellTokenContract?.address,
    contextState?.settings?.spCoinContract?.name,
    contextState?.settings?.spCoinContract?.symbol,
    contextState?.settings?.spCoinContract?.version,
    setExchangeContext,
  ]);

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
