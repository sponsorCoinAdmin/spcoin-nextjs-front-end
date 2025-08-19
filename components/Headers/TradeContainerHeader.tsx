// File: components/Headers/TradeContainerHeader.tsx
'use client';

import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigDialog from '@/components/Dialogs/Popup/ConfigDialog';
import { openDialog } from '@/components/Dialogs/Dialogs';
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

  const title = getTitleFromDisplay(activeDisplay);

  return (
    <div
      id="TradeContainerHeader"
      className="h-[60px] flex justify-between items-center w-full px-2.5 box-border shrink-0"
    >
      <ConfigDialog showPanel={false} />
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
            alt="Info Image"
            onClick={() => openDialog('#ConfigDialog')}
            className="absolute top-3 right-3 h-5 w-5 object-contain cursor-pointer transition duration-300 hover:rotate-[360deg]"
          />
        ) : (
          <button
            id="closeSelectionPanelButton"
            aria-label="Close dialog"
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
