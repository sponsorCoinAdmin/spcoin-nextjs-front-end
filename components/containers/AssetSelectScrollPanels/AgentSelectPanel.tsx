// File: components/containers/AgentSelectPanel.tsx

'use client';

import { useEffect } from 'react';
import {
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import AssetSelectPanel from './AssetSelectPanel';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AgentSelectPanel', DEBUG_ENABLED, LOG_TIME);

export default function AgentSelectPanel() {
  const { containerType, instanceId } = useSharedPanelContext();
  const { activeDisplay } = useActiveDisplay();

  // ✅ Skip render if this panel is not active
  if (activeDisplay !== SP_COIN_DISPLAY.AGENT_SELECT_PANEL) {
    debugLog.log(`⏭️ AgentSelectPanel → not active (instanceId=${instanceId}), skipping render`);
    return null;
  }

  useEffect(() => {
    debugLog.log(`🧩 AgentSelectPanel mounted for containerType=${containerType}, instanceId=${instanceId}`);
  }, [containerType, instanceId]);

  return <AssetSelectPanel />;
}
