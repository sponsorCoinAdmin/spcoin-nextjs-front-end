// File: lib/context/sync/syncTradeDataToPanel.ts

import { tokenContractsEqual } from '@/lib/network/utils';
import { TradeData } from '@/lib/structure';
import { TradePanelContextType } from '../TokenPanelProviders/useTradePanelContext';

export function syncTradeDataToPanel(
  tradeData: TradeData,
  panelContext: TradePanelContextType,
  debugLog: any
) {
  const isSell = panelContext.containerType === 'SELL_SELECT_CONTAINER';
  const isBuy = panelContext.containerType === 'BUY_SELECT_CONTAINER';

  const tradeToken = isSell
    ? tradeData.sellTokenContract
    : isBuy
    ? tradeData.buyTokenContract
    : undefined;

  const panelToken = panelContext.localTokenContract;

  if (!tokenContractsEqual(tradeToken, panelToken)) {
    debugLog.log(`🔄 [SYNC] TradeData → Panel mismatch`, {
      containerType: panelContext.containerType,
      tradeToken,
      panelToken,
    });

    // ⚠️ LOG ONLY — no auto-update (pure sync check)
  } else {
    debugLog.log(`✅ [SYNC] TradeData ↔ Panel in sync for ${panelContext.containerType}`);
  }
}
