// File: components/containers/AssetSelectPanels/TokenSelectPanel.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { Address } from 'viem';
import { TokenContract, SP_COIN_DISPLAY, InputState, WalletAccount } from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useAssetSelectionContext } from '@/lib/context/ScrollSelectPanels/useAssetSelectionContext';
import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { AssetSelectionProvider } from '@/lib/context/ScrollSelectPanels/AssetSelectionProvider';
import type { AssetSelectionBag } from '@/lib/context/ScrollSelectPanels/structure/types/panelBag';

// ✅ Local, instance-scoped sub-visibility (new panel display system)
import {
  AssetSelectionDisplayProvider,
  useAssetSelectionDisplay,
} from '@/lib/context/AssetSelection/AssetSelectionDisplayProvider';
import { ASSET_SELECTION_DISPLAY } from '@/lib/structure/assetSelection';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('TokenSelectPanel', DEBUG_ENABLED, LOG_TIME);

interface TokenSelectPanelProps {
  isActive: boolean;
  closePanelCallback: () => void;
  // 🔧 Widen to match AssetSelectionProvider’s expected type
  setTradingTokenCallback: (asset: TokenContract | WalletAccount) => void;
  /** Opposing side’s committed address (optional). BUY panel gets SELL’s addr; SELL panel gets BUY’s addr. */
  peerAddress?: string | Address;
}

export default function TokenSelectPanel({
  isActive,
  closePanelCallback,
  setTradingTokenCallback,
  peerAddress,
}: TokenSelectPanelProps) {
  const { activeDisplay } = useActiveDisplay();

  // 🔒 Run hooks unconditionally to satisfy Rules of Hooks
  useEffect(() => {
    debugLog.log('🟢 TokenSelectPanel mounted');
    return () => {
      debugLog.log('🔴 TokenSelectPanel unmounted');
    };
  }, []);

  const initialPanelBag: AssetSelectionBag = useMemo(
    () =>
      ({
        type: activeDisplay as SP_COIN_DISPLAY,
        ...(peerAddress ? { peerAddress } : {}),
      } as AssetSelectionBag),
    [activeDisplay, peerAddress]
  );

  const instanceId = useMemo(
    () =>
      `TOKEN_SELECT_${SP_COIN_DISPLAY[activeDisplay as SP_COIN_DISPLAY] ?? 'UNKNOWN'}`,
    [activeDisplay]
  );

  // ✅ Only branch at return; all hooks above run every render
  if (!isActive) return null;

  return (
    <AssetSelectionDisplayProvider
      instanceId={instanceId}
      initial={ASSET_SELECTION_DISPLAY.IDLE}
    >
      <AssetSelectionProvider
        closePanelCallback={closePanelCallback}
        setTradingTokenCallback={setTradingTokenCallback}
        containerType={activeDisplay as SP_COIN_DISPLAY}
        initialPanelBag={initialPanelBag}
      >
        <TokenSelectPanelInner />
      </AssetSelectionProvider>
    </AssetSelectionDisplayProvider>
  );
}

function TokenSelectPanelInner() {
  const { instanceId, inputState, validatedAsset } = useAssetSelectionContext();
  const { showErrorPreview, showAssetPreview, resetPreview } =
    useAssetSelectionDisplay();

  useEffect(() => {
    debugLog.log(`🟢 TokenSelectPanelInner mounted → instanceId=${instanceId}`);
    // Ensure no stale preview is shown when the panel opens
    resetPreview();
    return () => {
      debugLog.log(`🔴 TokenSelectPanelInner unmounted → instanceId=${instanceId}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId]);

  // 🔁 Bridge FSM → new panel display system (keep provider pure)
  useEffect(() => {
    switch (inputState) {
      case InputState.EMPTY_INPUT:
        resetPreview();
        break;
      case InputState.RESOLVE_ASSET:
        if (validatedAsset) showAssetPreview();
        break;
      case InputState.TOKEN_NOT_RESOLVED_ERROR:
      case InputState.RESOLVE_ASSET_ERROR:
        showErrorPreview();
        break;
      case InputState.CLOSE_SELECT_PANEL:
        resetPreview();
        break;
      default:
        break;
    }
  }, [inputState, validatedAsset, showAssetPreview, showErrorPreview, resetPreview]);

  // Note: AssetSelectPanel reads context; no props needed
  return <AssetSelectPanel />;
}
