// File: lib/context/AssetSelectPanels/hooks/useProviderCallbacks.ts
'use client';

import { useCallback, useRef } from 'react';
import type { TokenContract, WalletAccount } from '@/lib/structure';
import { useLatestRef } from '@/lib/hooks/useLatestRef';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const LOG_LEVEL: 'info' | 'warn' | 'error' = 'info';

// Keep env gating consistent with AssetSelectProvider (can remove the `|| true` after LOG_CLEANUP)
const DEBUG_ENABLED =
  (process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true') ||
  (process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true') ||
  (process.env.NEXT_PUBLIC_FSM === 'true') ||
  true;

const debugLog = createDebugLogger('useProviderCallbacks', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

// 🔎 Trace flag (env-controlled). Set NEXT_PUBLIC_TRACE_BALANCE=true to enable.
const TRACE_BALANCE = process.env.NEXT_PUBLIC_TRACE_BALANCE === 'true';

// Gated raw console logger (so we can turn off noisy logs in prod)
const rawLog = (...args: any[]) => {
  if (!DEBUG_ENABLED) return;
  // eslint-disable-next-line no-console
  console.log(...args);
};

// Narrow snapshot formatter so logs are readable and safe
function snapshotAsset(asset: TokenContract | WalletAccount | undefined) {
  if (!asset) return { kind: 'unknown', note: 'asset is undefined' };
  const a: any = asset;
  return {
    kind: (a?.symbol || a?.decimals != null) ? 'TokenContract' : 'WalletAccount',
    address: a?.address ?? '(none)',
    symbol: a?.symbol ?? '(none)',
    name: a?.name ?? '(none)',
    decimals: typeof a?.decimals === 'number' ? a.decimals : '(n/a)',
    logoURL: a?.logoURL ?? undefined,
    website: a?.website ?? undefined,
  };
}

type ParentCallbacks = {
  closePanelCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (asset: TokenContract | WalletAccount) => void;
};

export function useProviderCallbacks(parent: ParentCallbacks, instanceId: string) {
  const parentRef = useLatestRef(parent);

  // Optional: dedupe fast repeated identical selections to avoid double-calls
  const lastAssetKeyRef = useRef<string | null>(null);
  const getKey = (asset: TokenContract | WalletAccount) =>
    `${(asset as any)?.address ?? ''}|${(asset as any)?.symbol ?? ''}|${(asset as any)?.name ?? ''}`;

  const fireSetTradingToken = useCallback((asset: TokenContract | WalletAccount) => {
    try {
      const key = getKey(asset);
      if (key && lastAssetKeyRef.current === key) {
        rawLog('[useProviderCallbacks] ⏩ dedup: ignoring repeated setTradingTokenCallback', {
          instanceId,
          key,
          snapshot: snapshotAsset(asset),
        });
        // Still allow trace for visibility when enabled
        if (TRACE_BALANCE) {
          // eslint-disable-next-line no-console
          console.log('[TRACE][useProviderCallbacks] dedup skip (same asset key)', { instanceId, key });
        }
        return;
      }
      lastAssetKeyRef.current = key;

      debugLog.log?.(
        `[${instanceId}] 🚀 setTradingTokenCallback(asset=${(asset as any)?.address ?? 'wallet'})`
      );

      if (TRACE_BALANCE) {
        // eslint-disable-next-line no-console
        console.groupCollapsed('[TRACE][useProviderCallbacks] setTradingTokenCallback IN', { instanceId });
        // eslint-disable-next-line no-console
        console.log('asset snapshot:', snapshotAsset(asset));
        // eslint-disable-next-line no-console
        console.trace('stack (for call site)');
        // eslint-disable-next-line no-console
        console.groupEnd();

        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('spcoin:trace:setTradingToken', {
                detail: { instanceId, asset: snapshotAsset(asset) },
              })
            );
          }
        } catch {
          // ignore if event dispatching fails
        }
      }

      const fn = parentRef.current?.setTradingTokenCallback;
      if (!fn) {
        debugLog.warn?.(`[${instanceId}] setTradingTokenCallback missing on parentRef.current`);
        return;
      }

      fn(asset);

      if (TRACE_BALANCE) {
        // eslint-disable-next-line no-console
        console.log('[TRACE][useProviderCallbacks] setTradingTokenCallback OUT → parent invoked', {
          instanceId,
          address: (asset as any)?.address ?? '(none)',
          symbol: (asset as any)?.symbol ?? '(none)',
        });
      }
    } catch (e) {
      debugLog.error?.(`[${instanceId}] setTradingTokenCallback failed`, e);
      if (TRACE_BALANCE) {
        // eslint-disable-next-line no-console
        console.error('[TRACE][useProviderCallbacks] setTradingTokenCallback ERROR', {
          instanceId,
          error: e,
        });
      }
    }
  }, [instanceId, parentRef]);

  const fireClosePanel = useCallback((fromUser: boolean) => {
    try {
      debugLog.log?.(`[${instanceId}] 🚪 closePanelCallback(fromUser=${fromUser})`);

      if (TRACE_BALANCE) {
        // eslint-disable-next-line no-console
        console.log('[TRACE][useProviderCallbacks] closePanelCallback', { instanceId, fromUser });
      }

      const fn = parentRef.current?.closePanelCallback;
      if (!fn) {
        debugLog.warn?.(`[${instanceId}] closePanelCallback missing on parentRef.current`);
        return;
      }

      fn(fromUser);
    } catch (e) {
      debugLog.error?.(`[${instanceId}] closePanelCallback failed`, e);
      if (TRACE_BALANCE) {
        // eslint-disable-next-line no-console
        console.error('[TRACE][useProviderCallbacks] closePanelCallback ERROR', {
          instanceId,
          error: e,
        });
      }
    }
  }, [instanceId, parentRef]);

  return { fireSetTradingToken, fireClosePanel };
}
