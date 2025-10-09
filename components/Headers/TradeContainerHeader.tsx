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
import ConnectButton from '@/components/Buttons/Connect/ConnectButton';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

function titleFor(display: SP_COIN_DISPLAY): string {
  switch (display) {
    case SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL: return 'Select Sponsors Agent';
    case SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL: return 'Select a Token to Buy';
    case SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL: return 'Error Message Panel';
    case SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL: return 'Select Recipient to Sponsor';
    case SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL: return 'Select a Token to Sell';
    case SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL: return 'Sponsor Rate Configuration';
    case SP_COIN_DISPLAY.TRADING_STATION_PANEL: return 'Sponsor Coin Exchange';
    case SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL: return 'Select a Sponsor';
    case SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL: return 'Manage Sponsorships';
    default: return 'Main Panel Header';
  }
}

export default function TradeContainerHeader() {
  const { exchangeContext } = useExchangeContext();
  const { toTrading } = usePanelTransitions();

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Subscribe narrowly
  const vis = {
    sponsor: usePanelVisible(SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL),
    sell: usePanelVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL),
    buy: usePanelVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL),
    recipient: usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL),
    manage: usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL),
    agent: usePanelVisible(SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL),
    error: usePanelVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL),
    trading: usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL),
  };

  const currentDisplay: SP_COIN_DISPLAY = useMemo(() => {
    if (vis.sponsor) return SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL;
    if (vis.sell) return SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL;
    if (vis.buy) return SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL;
    if (vis.recipient) return SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL;
    if (vis.manage) return SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL;
    if (vis.agent) return SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL;
    if (vis.error) return SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL;
    if (vis.trading) return SP_COIN_DISPLAY.TRADING_STATION_PANEL;
    return SP_COIN_DISPLAY.UNDEFINED;
  }, [vis]);

  const title = titleFor(currentDisplay);

  const onOpenConfig = useCallback(() => setIsConfigOpen(true), []);
  const onCloseConfig = useCallback(() => setIsConfigOpen(false), []);
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
        {vis.trading ? (
          <Image
            src={cog_png}
            alt="Open settings"
            title="Open settings"
            onClick={onOpenConfig}
            className="absolute top-3 right-3 h-5 w-5 object-contain cursor-pointer transition duration-300 hover:rotate-[360deg]"
            priority
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
}
