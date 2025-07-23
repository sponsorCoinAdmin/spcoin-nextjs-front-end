// File: components/Headers/TradeContainerHeader.tsx

import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigDialog from '@/components/Dialogs/Popup/ConfigDialog';
import { openDialog } from '@/components/Dialogs/Dialogs';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useActiveDisplay, useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useCallback } from 'react';

interface Props {
  closeCallback: () => void;
}

const TradeContainerHeader = ({ closeCallback }: Props) => {
  const { exchangeContext } = useExchangeContext();
  const { activeDisplay, setActiveDisplay } = useActiveDisplay();

  let title: string;

  switch (activeDisplay) {
    case SP_COIN_DISPLAY.AGENT_SELECT_CONTAINER:
      title = 'Select Sponsors Agent';
      break;
    case SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL:
      title = 'Select a Token to Buy';
      break;
    case SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL:
      title = 'Error Message Panel';
      break;
    case SP_COIN_DISPLAY.RECIPIENT_SCROLL_PANEL:
      title = 'Select Recipient to Sponsor';
      break;
    case SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL:
      title = 'Select a Token to Sell';
      break;
    case SP_COIN_DISPLAY.TRADING_STATION_PANEL:
      title = 'Sponsor Coin Exchange';
      break;
    default:
      title = 'Panel';
  }

  return (
    <div
      id="TradeContainerHeader"
      className="h-[60px] flex justify-between items-center w-full px-2.5 box-border shrink-0"
    >
      <ConfigDialog showDialog={false} />
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
            id="closeScrollPanelButton"
            aria-label="Close dialog"
            onClick={closeCallback}
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
