// File: @/components/views/AssetSelectPanels/PanelListSelectWrapper.tsx
'use client';

import { useMemo, useCallback, useEffect } from 'react';
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

// ✅ SSOT: listType is now expressed using SP_COIN_DISPLAY only.
// Keep this union narrow to prevent passing arbitrary display IDs.
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

// KEEP your existing makeInitialPanelBag here (unchanged)
// IMPORTANT: this stub must be replaced with your real switch.
// If you truly want to keep a stub, it must still *use* the args to avoid TS "unused" warnings.
function makeInitialPanelBag(
  _panel: SP_COIN_DISPLAY,
  _peerAddress?: `0x${string}`,
): UnionBag | undefined {
  // ... your existing switch ...
  return undefined;
}

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

  // ✅ use onCommit so TS doesn't warn if the inner path gets refactored
  // (and so the prop is "read" here too)
  const onCommitStable = onCommit;

  return (
    <PanelListSelectWrapperInner
      panel={panel}
      feedType={feedType}
      listType={listType}
      instancePrefix={instancePrefix}
      peerAddress={peerAddress}
      onCommit={onCommitStable}
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
  // ✅ remove unused setExchangeContext to satisfy TS
  const { exchangeContext } = useExchangeContext();
  const { closeTop } = usePanelTransitions();

  const chainId = exchangeContext?.network?.chainId ?? 1;
  const instanceId = useMemo(
    () => `${instancePrefix.toUpperCase()}_${SP_COIN_DISPLAY[panel]}_${chainId}`,
    [instancePrefix, panel, chainId],
  );

  const initialPanelBag = useMemo(
    () => makeInitialPanelBag(panel, peerAddress),
    [panel, peerAddress],
  );

  useEffect(() => {
    debugLog.log?.('[inner:mount]', {
      panel,
      panelLabel: SP_COIN_DISPLAY[panel],
      chainId,
      instanceId,
      feedTypeOverride: feedType,
      feedTypeOverrideLabel: FEED_TYPE[feedType],
      listType,
      listTypeLabel: SP_COIN_DISPLAY[listType],
      instancePrefix,
      peerAddressPreview: peerAddress ? `${peerAddress.slice(0, 10)}…` : '(none)',
      hasInitialBag: !!initialPanelBag,
      initialBagType: (initialPanelBag as any)?.type,
    });
  }, [panel, chainId, instanceId, feedType, listType, instancePrefix, peerAddress, initialPanelBag]);

  // KEEP your existing closeForProvider + handleCommit logic exactly as-is
  const closeForProvider = useCallback(
    (_fromUser?: boolean) => {
      if (!suppressAutoClose) closeTop('PanelListSelectWrapper:closeForProvider(pop)');
    },
    [closeTop, suppressAutoClose],
  );

  const handleCommit = useCallback(
    (asset: spCoinAccount | TokenContract) => {
      // ... your existing buy/sell updates ...

      // ✅ ensure prop is "read" here
      onCommit?.(asset);

      if (!suppressAutoClose) closeTop('PanelListSelectWrapper:handleCommit(pop)');
    },
    [onCommit, closeTop, suppressAutoClose],
  );

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setSelectedAssetCallback={handleCommit}
        containerType={panel}
        initialPanelBag={initialPanelBag}
        feedTypeOverride={feedType}
      >
        <AssetListSelectPanel listType={listType} />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
