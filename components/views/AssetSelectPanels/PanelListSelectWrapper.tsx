// File: @/components/views/AssetSelectPanels/PanelListSelectWrapper.tsx
'use client';

import { useMemo, useCallback, useEffect } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { spCoinAccount, TokenContract } from '@/lib/structure';

import { useExchangeContext } from '@/lib/context/hooks';
import { useActiveRadioPanel } from '@/lib/context/exchangeContext/hooks/useActiveRadioPanel';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';

import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import AssetListSelectPanel from './AssetListSelectPanel';

import type { AssetSelectBag as UnionBag } from '@/lib/context/structure/types/panelBag';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false as const;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('PanelListSelectWrapper', DEBUG_ENABLED, LOG_TIME);

type Props = {
  peerAddress?: `0x${string}`;
  onCommit: (asset: spCoinAccount | TokenContract) => void;
  containerTypeOverride?: SP_COIN_DISPLAY;
};

function makeInitialPanelBag(panel: SP_COIN_DISPLAY, peerAddress?: `0x${string}`): UnionBag | undefined {
  void panel;
  void peerAddress;
  // ... your existing switch ...
  return undefined;
}

export default function PanelListSelectWrapper({ peerAddress, onCommit, containerTypeOverride }: Props) {
  const panel = useActiveRadioPanel();
  const containerType = containerTypeOverride ?? panel;
  if (containerType == null) return null;

  const { exchangeContext } = useExchangeContext();
  const { closeTop } = usePanelTransitions();

  const appChainId = exchangeContext?.network?.appChainId ?? 1;

  // Generate a stable instance id based on panel + chain
  const instanceId = useMemo(() => `${SP_COIN_DISPLAY[containerType]}`, [containerType]);
  const chainScopedInstanceId = useMemo(() => `${instanceId}_${appChainId}`, [instanceId, appChainId]);

  const initialPanelBag = useMemo(() => makeInitialPanelBag(containerType, peerAddress), [containerType, peerAddress]);

  useEffect(() => {
    debugLog.log?.('[mount]', {
      panel: containerType,
      panelLabel: SP_COIN_DISPLAY[containerType],
      appChainId,
      instanceId,
      chainScopedInstanceId,
      peerAddressPreview: peerAddress ? `${peerAddress.slice(0, 10)}…` : '(none)',
      hasInitialBag: !!initialPanelBag,
      initialBagType: (initialPanelBag as any)?.type,
    });
  }, [panel, appChainId, instanceId, chainScopedInstanceId, peerAddress, initialPanelBag]);

  const handleClose = useCallback(() => {
    closeTop('PanelListSelectWrapper:closeTop');
  }, [closeTop]);

  const handleCommit = useCallback(
    (asset: spCoinAccount | TokenContract) => {
      onCommit(asset);
      closeTop('PanelListSelectWrapper:handleCommit(close)');
    },
    [onCommit, closeTop],
  );

  return (
    <AssetSelectDisplayProvider instanceId={chainScopedInstanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={handleClose}
        setSelectedAssetCallback={handleCommit}
        containerType={containerType}
        initialPanelBag={initialPanelBag}
      >
        <AssetListSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
