// File: components/Headers/TradeContainerHeader.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigPanel from '@/components/views/Config/ConfigPanel';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import ConnectButton from '../Buttons/Connect/ConnectButton';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

function getTitleFromDisplay(d: SP_COIN_DISPLAY): string {
  switch (d) {
    case SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST:     return 'Select Sponsors Agent';
    case SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST:       return 'Select a Token to Buy';
    case SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL:         return 'Error Message Panel';
    case SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST: return 'Select Recipient to Sponsor';
    case SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST:      return 'Select a Token to Sell';
    case SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL:    return 'Sponsor Rate Configuration';
    case SP_COIN_DISPLAY.TRADING_STATION_PANEL:       return 'Sponsor Coin Exchange';
    case SP_COIN_DISPLAY.SPONSOR_SELECT_PANEL_LIST:   return 'Select a Sponsor';
    case SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL:   return 'Manage Sponsorships';
    default:                                          return 'Main Panel Header';
  }
}

const TradeContainerHeader = () => {
  const { exchangeContext } = useExchangeContext();
  const { toTrading } = usePanelTransitions();

  // Local state (keep hooks unconditional)
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Phase 7: subscribe narrowly to each relevant panel flag
  const sponsorListVis   = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_SELECT_PANEL_LIST);
  const sellListVis      = usePanelVisible(SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST);
  const buyListVis       = usePanelVisible(SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST);
  const recipientListVis = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST);
  const managePanelVis   = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const agentListVis     = usePanelVisible(SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST);
  const errorVis         = usePanelVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
  const tradingVis       = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);

  // Determine current display in priority order
  const currentDisplay: SP_COIN_DISPLAY = useMemo(() => {
    if (sponsorListVis)   return SP_COIN_DISPLAY.SPONSOR_SELECT_PANEL_LIST;
    if (sellListVis)      return SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST;
    if (buyListVis)       return SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST;
    if (recipientListVis) return SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST;
    if (managePanelVis)   return SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL;
    if (agentListVis)     return SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST;
    if (errorVis)         return SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL;
    if (tradingVis)       return SP_COIN_DISPLAY.TRADING_STATION_PANEL;
    return SP_COIN_DISPLAY.UNDEFINED;
  }, [
    sponsorListVis,
    sellListVis,
    buyListVis,
    recipientListVis,
    managePanelVis,
    agentListVis,
    errorVis,
    tradingVis,
  ]);

  const title = getTitleFromDisplay(currentDisplay);
  const isTradingVisible = tradingVis;

  const onOpenConfig   = useCallback(() => setIsConfigOpen(true), []);
  const onCloseConfig  = useCallback(() => setIsConfigOpen(false), []);
  const onCloseOverlay = useCallback(() => { toTrading(); }, [toTrading]);

  return (
    <div
      id="TradeContainerHeader"
      className="h-[60px] flex justify-between items-center w-full px-2.5 box-border shrink-0"
    >
      <ConfigPanel showPanel={isConfigOpen} onClose={onCloseConfig as any} />

      <div
        id="SponsorCoinLogo.png"
        onDoubleClick={() => exchangeContextDump(exchangeContext)}
        className={styles.leftLogo}
      >
        <ConnectButton
          showName={false}
          showSymbol={false}
          showChevron={false}
          showConnect={false}
          showDisconnect={false}
          showHoverBg={false}
        />
      </div>

      <h4 id="TradeContainerHeaderTitle" className={styles.center}>
        {title}
      </h4>

      <div className={styles.rightSideControl}>
        {isTradingVisible ? (
          <Image
            src={cog_png}
            alt="Open settings"
            title="Open settings"
            onClick={onOpenConfig}
            className="absolute top-3 right-3 h-5 w-5 object-contain cursor-pointer transition duration-300 hover:rotate-[360deg]"
          />
        ) : (
          <button
            id="closeSelectionPanelButton"
            type="button"
            aria-label="Close"
            title="Close"
            onClick={onCloseOverlay}
            className="absolute top-1 right-1 h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] flex items-center justify-center leading-none
                       hover:bg-[#5981F3] hover:text-[#243056] transition-colors text-3xl"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default TradeContainerHeader;
