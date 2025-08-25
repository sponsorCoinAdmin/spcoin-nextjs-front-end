'use client';

import { useState, useCallback } from 'react';
import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigPanel from '@/components/views/Config/ConfigPanel';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useActiveDisplay, useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';

interface Props {
  closePanelCallback: () => void;
}

function getTitleFromDisplay(d: SP_COIN_DISPLAY): string {
  switch (d) {
    case SP_COIN_DISPLAY.AGENT_SELECT_PANEL:
      return 'Select Sponsors Agent';
    case SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL:
      return 'Select a Token to Buy';
    case SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL:
      return 'Error Message Panel';
    case SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL:
      return 'Select Recipient to Sponsor';
    case SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL:
      return 'Select a Token to Sell';
    case SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL:
      return 'Sponsor Rate Configuration';
    case SP_COIN_DISPLAY.TRADING_STATION_PANEL:
      return 'Sponsor Coin Exchange';
    default:
      return 'Panel';
  }
}

const TradeContainerHeader = ({ closePanelCallback }: Props) => {
  const { exchangeContext } = useExchangeContext();
  const { activeDisplay } = useActiveDisplay();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const title = getTitleFromDisplay(activeDisplay);

  const onOpenConfig = useCallback(() => setIsConfigOpen(true), []);
  const onCloseConfig = useCallback(() => setIsConfigOpen(false), []);

  return (
    <div
      id="TradeContainerHeader"
      className="h-[60px] flex justify-between items-center w-full px-2.5 box-border shrink-0"
    >
      {/* Controlled config dialog (no dependency on openDialog helper) */}
      <ConfigPanel showPanel={isConfigOpen} onClose={onCloseConfig as any} />

      <div
        id="SponsorCoinLogo.png"
        onClick={() => exchangeContextDump(exchangeContext)}
        className={styles.leftLogo}
      >
        <Image
          src={spCoin_png}
          className={styles.logoImg}
          alt="SponsorCoin Logo"
          style={{ height: 'auto', width: 'auto' }}
        />
      </div>

      <h4 id="TradeContainerHeaderTitle" className={styles.center}>
        {title}
      </h4>

      <div className={styles.rightSideControl}>
        {activeDisplay === SP_COIN_DISPLAY.TRADING_STATION_PANEL ? (
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
            aria-label="Close Config"
            onClick={closePanelCallback}
            className="cursor-pointer rounded border-none w-5 text-xl text-white hover:text-gray-400"
          >
            X
          </button>
        )}
      </div>
    </div>
  );
};

export default TradeContainerHeader;
