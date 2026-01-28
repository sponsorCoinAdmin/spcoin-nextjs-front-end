// File: @/components/views/AssetSelectPanels/PanelListSelectWrapper.tsx
'use client';

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { SP_COIN_DISPLAY, FEED_TYPE } from '@/lib/structure';
import type { spCoinAccount, TokenContract } from '@/lib/structure';

import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';

import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import AssetListSelectPanel from './AssetListSelectPanel';


import type { AssetSelectBag as UnionBag } from '@/lib/context/structure/types/panelBag';

import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false as const;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('PanelListSelectWrapper', DEBUG_ENABLED, LOG_TIME);

export type ASSET_LIST_MODE =
  | SP_COIN_DISPLAY.AGENTS
  | SP_COIN_DISPLAY.RECIPIENTS
  | SP_COIN_DISPLAY.SPONSORS
  | SP_COIN_DISPLAY.UNSPONSOR_SP_COINS;

type Props = {
  panel: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  listType: ASSET_LIST_MODE;
  instancePrefix: string;
  peerAddress?: `0x${string}`;
  onCommit: (asset: spCoinAccount | TokenContract) => void;
  suppressAutoClose?: boolean;
};

function makeInitialPanelBag(panel: SP_COIN_DISPLAY, peerAddress?: `0x${string}`): UnionBag | undefined {
  void panel;
  void peerAddress;
  // ... your existing switch ...
  return undefined;
}

/**
 * Tailwind-only "hide scrollbar" (no CSS file):
 * - scrollbar-width: none (Firefox)
 * - -ms-overflow-style: none (IE/Edge legacy)
 * - ::-webkit-scrollbar { display: none } (Chrome/Safari)
 */
const HIDE_SCROLLBAR_TW =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export default function PanelListSelectWrapper({
  panel,
  feedType,
  listType,
  instancePrefix,
  peerAddress,
  onCommit,
  suppressAutoClose,
}: Props) {
  const visible = usePanelVisible(panel);

  debugLog.log?.('[gate]', {
    visible,
    panel,
    panelLabel: SP_COIN_DISPLAY[panel],
    feedTypeOverride: feedType,
    feedTypeOverrideLabel: FEED_TYPE[feedType],
    listType,
    listTypeLabel: SP_COIN_DISPLAY[listType],
    instancePrefix,
  });

  if (!visible) return null;

  return (
    <PanelListSelectWrapperInner
      panel={panel}
      feedType={feedType}
      listType={listType}
      instancePrefix={instancePrefix}
      peerAddress={peerAddress}
      onCommit={onCommit}
      suppressAutoClose={suppressAutoClose}
    />
  );
}

function PanelListSelectWrapperInner({
  panel,
  feedType,
  listType,
  instancePrefix,
  peerAddress,
  onCommit,
  suppressAutoClose,
}: Props) {
  const { exchangeContext } = useExchangeContext();
  const { closeTop } = usePanelTransitions();

  // Use appChainId (source of truth for app network)
  const appChainId = exchangeContext?.network?.appChainId ?? 1;

  // ✅ Stable per-panel instance (prevents remount/scroll reset when chain id resolves)
  const instanceId = useMemo(
    () => `${instancePrefix.toUpperCase()}_${SP_COIN_DISPLAY[panel]}`,
    [instancePrefix, panel],
  );

  // ✅ Chain-scoped id for any caches that truly must be per-chain
  const chainScopedInstanceId = useMemo(() => `${instanceId}_${appChainId}`, [instanceId, appChainId]);

  const initialPanelBag = useMemo(() => makeInitialPanelBag(panel, peerAddress), [panel, peerAddress]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    debugLog.log?.('[inner:mount]', {
      panel,
      panelLabel: SP_COIN_DISPLAY[panel],
      appChainId,
      instanceId,
      chainScopedInstanceId,
      feedTypeOverride: feedType,
      feedTypeOverrideLabel: FEED_TYPE[feedType],
      listType,
      listTypeLabel: SP_COIN_DISPLAY[listType],
      instancePrefix,
      peerAddressPreview: peerAddress ? `${peerAddress.slice(0, 10)}…` : '(none)',
      hasInitialBag: !!initialPanelBag,
      initialBagType: (initialPanelBag as any)?.type,
    });
  }, [
    panel,
    appChainId,
    instanceId,
    chainScopedInstanceId,
    feedType,
    listType,
    instancePrefix,
    peerAddress,
    initialPanelBag,
  ]);

  const closeForProvider = useCallback(
    (_fromUser?: boolean) => {
      if (!suppressAutoClose) closeTop('PanelListSelectWrapper:closeForProvider(pop)');
    },
    [closeTop, suppressAutoClose],
  );

  const handleCommit = useCallback(
    (asset: spCoinAccount | TokenContract) => {
      onCommit(asset);
      if (!suppressAutoClose) closeTop('PanelListSelectWrapper:handleCommit(pop)');
    },
    [onCommit, closeTop, suppressAutoClose],
  );

  /**
   * Capture wheel BEFORE children (rows), and force-scroll our container.
   * Fixes cases where wheel events target row DIVs and scrollTop never changes.
   */
  const onWheelCapture = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollHeight > el.clientHeight) {
      el.scrollTop += e.deltaY;
      e.preventDefault();
    }

    debugLog.log?.('[wheel:capture]', {
      deltaY: e.deltaY,
      targetTag: (e.target as any)?.tagName,
      targetClass: (e.target as any)?.className,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
    });
  }, []);

  return (
    <AssetSelectDisplayProvider instanceId={chainScopedInstanceId}>
      <AssetSelectProvider
        key={instanceId} // ✅ stable; no surprise remount on chain resolve
        closePanelCallback={closeForProvider}
        setSelectedAssetCallback={handleCommit}
        containerType={panel}
        initialPanelBag={initialPanelBag}
        feedTypeOverride={feedType}
      >
          {/* Wheel capture boundary */}
          <div className="h-full w-full min-h-0" onWheelCapture={onWheelCapture}>
            <AssetListSelectPanel listType={listType} />
          </div>
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
