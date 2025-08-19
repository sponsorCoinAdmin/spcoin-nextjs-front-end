// File: components/containers/RecipientSelectHeader.tsx
'use client';

import styles from '@/styles/Exchange.module.css';
import { Settings } from 'lucide-react';
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigDialog from '@/components/Dialogs/Popup/ConfigDialog';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useExchangeContext, useActiveDisplay } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * Header for the Recipient selection flow.
 * Migrated to SP_COIN_DISPLAY + useActiveDisplay.
 */
const RecipientSelectHeader = ({ slippageBps, closePanel }: any) => {
  const { exchangeContext } = useExchangeContext();
  const { activeDisplay, setActiveDisplay } = useActiveDisplay();

  const toggleSponsorRateConfigPanel = () => {
    const next =
      activeDisplay === SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL
        ? SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL
        : SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL;

    setActiveDisplay(next);
  };

  return (
    <div className={styles.tradeContainerHeader}>
      <ConfigDialog showPanel={false} />

      <div onClick={() => exchangeContextDump(exchangeContext)}>
        <Image
          src={spCoin_png}
          className={styles.logoImg}
          width={30}
          height={30}
          alt="SponsorCoin Logo"
        />
      </div>

      <h4 className={styles.center}>Sponsor Recipient Selection</h4>

      <div title="Settings">
        <Settings className={styles.cog} size={18} style={{ cursor: 'pointer' }} />
      </div>

      <div>
        <Image
          src={cog_png}
          className={styles.cogImg2}
          width={20}
          height={20}
          alt="Toggle Sponsor Rate Config"
          onClick={toggleSponsorRateConfigPanel}
        />
      </div>
    </div>
  );
};

export default RecipientSelectHeader;
