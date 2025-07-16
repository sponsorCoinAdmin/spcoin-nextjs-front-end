// File: lib/context/sync/syncAllPanelsToTradeData.ts

import { tokenContractsEqual } from '@/lib/network/utils';
import { TradeData } from '@/lib/structure';
import { TradePanelContextType } from '../TokenPanelProviders/useTradePanelContext';

export function syncAllPanelsToTradeData(
  panelContexts: TradePanelContextType[],
  tradeData: TradeData,
  debugLog: any
) {
  panelContexts.forEach((panelContext) => {
    const panelToken = panelContext.localTokenContract;
    const isSell = panelContext.containerType === 'SELL_SELECT_CONTAINER';
    const isBuy = panelContext.containerType === 'BUY_SELECT_CONTAINER';

    const tradeToken = isSell
      ? tradeData.sellTokenContract
      : isBuy
      ? tradeData.buyTokenContract
      : undefined;

    if (!tokenContractsEqual(panelToken, tradeToken)) {
      debugLog.log(`🔄 [SYNC] Panel → TradeData mismatch detected`, {
        containerType: panelContext.containerType,
        panelToken,
        tradeToken,
      });

      // ⚠️ LOG ONLY — no automatic overwrite
      // If you want to overwrite, you can call setLocalTokenContract here
    } else {
      debugLog.log(`✅ [SYNC] Panel ↔ TradeData is in sync for ${panelContext.containerType}`);
    }
  });
}
