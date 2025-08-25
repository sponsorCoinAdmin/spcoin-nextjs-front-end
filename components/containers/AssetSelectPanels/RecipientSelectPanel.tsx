// File: components/containers/AgentSelectPanel.tsx

'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { SP_COIN_DISPLAY, WalletAccount, TokenContract } from '@/lib/structure';

import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// ✅ Local sub-visibility controller (new panel display system)
import {
  AssetSelectDisplayProvider,
  useAssetSelectDisplay,
} from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { ASSET_SELECTION_DISPLAY } from '@/lib/structure/assetSelection';
import { useExchangeContext } from '@/lib/context/hooks';
import { AssetSelectPanel } from '../AssetSelectScrollPanels';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AgentSelectPanel', DEBUG_ENABLED, LOG_TIME);

interface AgentSelectPanelProps {
  isActive: boolean;
  closePanelCallback: () => void;
  // 🔧 Widened to match AssetSelectProvider’s expected type
  setTradingTokenCallback: (asset: WalletAccount | TokenContract) => void;
}

export default function AgentSelectPanel({
  isActive,
  closePanelCallback,
  setTradingTokenCallback,
}: AgentSelectPanelProps) {
  // 🚫 Hooks must run before any early return
  const instanceId = useMemo(() => 'AGENT_SELECT', []);

  useEffect(() => {
    if (!isActive) return;
    debugLog.log(`🧩 AgentSelectPanel → rendering with local sub-display control`);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <AssetSelectDisplayProvider
      instanceId={instanceId}
      initial={ASSET_SELECTION_DISPLAY.IDLE}
    >
      <AgentSelectPanelInner
        closePanelCallback={closePanelCallback}
        setTradingTokenCallback={setTradingTokenCallback}
      />
    </AssetSelectDisplayProvider>
  );
}

function AgentSelectPanelInner({
  closePanelCallback,
  setTradingTokenCallback,
}: {
  closePanelCallback: () => void;
  setTradingTokenCallback: (asset: WalletAccount | TokenContract) => void;
}) {
  const { resetPreview } = useAssetSelectDisplay();
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const [agentAccount, setAgentAccount] = useState(
    exchangeContext.accounts.agentAccount
  );

  // ✅ Prevent stale sub-display when panel mounts
  useEffect(() => {
    resetPreview();
  }, [resetPreview]);

  // Keep ExchangeContext in sync with local selection
  useEffect(() => {
    if (exchangeContext.accounts.agentAccount !== agentAccount) {
      setExchangeContext((prev) => {
        const cloned = structuredClone(prev);
        cloned.accounts.agentAccount = agentAccount;
        return cloned;
      });
    }
  }, [agentAccount, exchangeContext, setExchangeContext]);

  // Local handler to clear selection
  const clearAgentSelect = useCallback(() => {
    resetPreview();
    setAgentAccount(undefined);
    debugLog.log('🧼 Cleared agent selection & reset sub-display to IDLE');
  }, [resetPreview]);

  return (
    <AssetSelectProvider
      closePanelCallback={closePanelCallback}
      setTradingTokenCallback={setTradingTokenCallback}
      // 🔒 Identity only — do NOT toggle this for sub-visibility anymore
      containerType={SP_COIN_DISPLAY.AGENT_SELECT_PANEL}
    >
      {/* Reads everything from context; no props needed */}
      <AssetSelectPanel />
      {/* If you need a clear button in the UI, wire `clearAgentSelect` via context-driven UI. */}
    </AssetSelectProvider>
  );
}
