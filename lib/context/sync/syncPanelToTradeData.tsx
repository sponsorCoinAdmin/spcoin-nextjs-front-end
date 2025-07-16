// File: lib/context/sync/syncPanelToTradeData.ts

import { tokenContractsEqual } from '@/lib/network/utils';
import { TradeData } from '@/lib/structure';
import { TradePanelContextType } from '../TokenPanelProviders/useTradePanelContext';

const UPDATE_TRADE_DATA_TRADE_PANELS = process.env.NEXT_PUBLIC_UPDATE_TRADE_DATA_VIA_TRADE_PANELS === 'true';

export function syncPanelToTradeData(
  panelContext: TradePanelContextType,
  tradeData: TradeData,
  debugLog: any
) {
  if (!UPDATE_TRADE_DATA_TRADE_PANELS) {
    debugLog.log(`⚠️ [BLOCKED] syncPanelToTradeData skipped → NEXT_PUBLIC_UPDATE_TRADE_DATA_VIA_TRADE_PANELS is false`);
    return;
  }

  const panelToken = panelContext.localTokenContract;
  const isSell = panelContext.containerType === 'SELL_SELECT_CONTAINER';
  const isBuy = panelContext.containerType === 'BUY_SELECT_CONTAINER';

  const tradeToken = isSell
    ? tradeData.sellTokenContract
    : isBuy
    ? tradeData.buyTokenContract
    : undefined;

  if (!tokenContractsEqual(panelToken, tradeToken)) {
    debugLog.log(`🔄 [SYNC] Panel → TradeData mismatch`, {
      containerType: panelContext.containerType,
      panelToken,
      tradeToken,
    });

    // ⚠️ LOG ONLY — no auto-update to avoid accidental overwrite
  } else {
    debugLog.log(`✅ [SYNC] Panel ↔ TradeData in sync for ${panelContext.containerType}`);
  }
}
