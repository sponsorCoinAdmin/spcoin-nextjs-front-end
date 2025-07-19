// File: components/TradeContainerHeader.tsx

import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigDialog from '@/components/Dialogs/Popup/ConfigDialog';
import { openDialog } from '@/components/Dialogs/Dialogs';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useExchangeContext, useSpCoinDisplay } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure'; // ✅ make sure enum is imported
const TradeContainerHeader = () => {
  const { exchangeContext } = useExchangeContext();

  //
  const [ spCoinDisplay ] = useSpCoinDisplay();

  const title =
    spCoinDisplay === SP_COIN_DISPLAY.SHOW_TRADING_STATION_PANEL
      ? 'Sponsor Coin Exchange'
      : spCoinDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_PANEL
        ? 'Select a Recipient to Follow'
        : spCoinDisplay === SP_COIN_DISPLAY.SHOW_AGENT_SELECT_CONTAINER
          ? 'Select a Sponsoring Agent'
          : spCoinDisplay === SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_PANEL
            ? 'Select a Token to Sell/Buy'
            : '';

  return (
    <div className={styles.tradeContainerHeader}>
      <ConfigDialog showDialog={false} />

      <div className={styles.leftH}>
        <div onClick={() => exchangeContextDump(exchangeContext)} style={{ cursor: 'pointer' }}>
          <Image
            src={spCoin_png}
            className={styles.logoImg}
            alt="SponsorCoin Logo"
          />
        </div>

        <h4>{title}</h4> {/* ✅ title no longer has center class, stays left-aligned */}
      </div>

      <div className={styles.rightH}>
        <Image
          src={cog_png}
          alt="Settings"
          onClick={() => openDialog('#ConfigDialog')}
          className={styles.cogImg2}
        />
      </div>
    </div>
  );
};

export default TradeContainerHeader;
