'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useExchangeContext } from '@/lib/context/hooks';
import {
  TokenSelectScrollPanel,
  RecipientSelectScrollPanel,
} from '@/components/containers/AssetSelectScroll';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_VIEW === 'true';
const debugLog = createDebugLogger('ScrollPanelView', DEBUG_ENABLED, LOG_TIME);

export default function ScrollPanelView() {
  const { assetSelectScrollDisplay } = useExchangeContext().exchangeContext.settings;

  debugLog.log(`🔍 ScrollPanelView render triggered`);
  debugLog.log(`🧩 Current assetSelectScrollDisplay = ${assetSelectScrollDisplay}`);
  debugLog.log(`🎯 Enum Comparisons:`, {
    SHOW_TOKEN_SCROLL_CONTAINER: SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER,
    SHOW_RECIPIENT_SCROLL_CONTAINER: SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER,
    DISPLAY_OFF: SP_COIN_DISPLAY.DISPLAY_OFF,
    isTokenPanel: assetSelectScrollDisplay === SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER,
    isRecipientPanel: assetSelectScrollDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER,
    isOff: assetSelectScrollDisplay === SP_COIN_DISPLAY.DISPLAY_OFF,
  });

  const renderDebugText = (label: string) => (
    <div className="text-xs text-gray-400 px-2 mb-2">[debug] {label}</div>
  );

  switch (assetSelectScrollDisplay) {
    case SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER:
      return (
        <>
          {renderDebugText('📦 Rendering TokenSelectScrollPanel')}
          <TokenSelectScrollPanel />
        </>
      );
    case SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER:
      return (
        <>
          {renderDebugText('📦 Rendering RecipientSelectScrollPanel')}
          <RecipientSelectScrollPanel />
        </>
      );
    default:
      return renderDebugText('❌ No matching panel, returning null');
  }
}
