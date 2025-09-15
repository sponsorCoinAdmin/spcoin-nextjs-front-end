// File: components/Headers/TradeContainerHeader.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigPanel from '@/components/views/Config/ConfigPanel';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import ConnectButton from '../Buttons/Connect/ConnectButton';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

interface Props {
  closePanelCallback: () => void;
}

function getTitleFromDisplay(d: SP_COIN_DISPLAY): string {
  switch (d) {
    case SP_COIN_DISPLAY.AGENT_SELECT_CONFIG_PANEL:
      return 'Select Sponsors Agent';
    case SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL:
      return 'Select a Token to Buy';
    case SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL:
      return 'Error Message Panel';
    case SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_PANEL:
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
  const { isVisible } = usePanelTree();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Derive the "current" display from the tree
  const currentDisplay: SP_COIN_DISPLAY = useMemo(() => {
    if (isVisible(SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL)) return SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL;
    if (isVisible(SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL))  return SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL;
    if (isVisible(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_PANEL))   return SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_PANEL;
    if (isVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL))      return SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL;
    if (isVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL))    return SP_COIN_DISPLAY.TRADING_STATION_PANEL;
    return SP_COIN_DISPLAY.UNDEFINED;
  }, [isVisible]);

  const title = getTitleFromDisplay(currentDisplay);
  const isTradingVisible = currentDisplay === SP_COIN_DISPLAY.TRADING_STATION_PANEL;

  const onOpenConfig = useCallback(() => setIsConfigOpen(true), []);
  const onCloseConfig = useCallback(() => setIsConfigOpen(false), []);

  return (
    <div
      id="TradeContainerHeader"
      className="h-[60px] flex justify-between items-center w-full px-2.5 box-border shrink-0"
    >
      {/* Controlled config dialog */}
      <ConfigPanel showPanel={isConfigOpen} onClose={onCloseConfig as any} />

      <div
        id="SponsorCoinLogo.png"
        onDoubleClick={true ? () => exchangeContextDump(exchangeContext) : undefined}
        className={styles.leftLogo}
      >
        {/* <Image
          src={spCoin_png}
          className={styles.logoImg}
          alt="SponsorCoin Logo"
          style={{ height: 'auto', width: 'auto' }}
        /> */}
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
            onClick={closePanelCallback}
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
