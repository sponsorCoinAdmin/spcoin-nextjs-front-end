// File: components/containers/RecipientSelectHeader.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import { Settings } from 'lucide-react'; // ✅ Lucide replacement
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigDialog from '@/components/Dialogs/Popup/ConfigDialog';
import { openDialog } from '@/components/Dialogs/Dialogs';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useSpCoinDisplay } from '@/lib/context/hooks';

const RecipientSelectHeader = ({ slippageBps, closeDialog }: any) => {
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();
  const { exchangeContext } = useExchangeContext();

  const toggleSponsorRateConfig = () => {
    if (spCoinDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG) {
      alert("Sponsor Rate Config spCoinDisplay is set to SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG");
      setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG);
    } else {
      alert("Sponsor Rate Config spCoinDisplay is set to SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG");
      setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG);
    }
  };

  return (
    <div className={styles.tradeContainerHeader}>
      <ConfigDialog showDialog={false} />
      <div onClick={() => exchangeContextDump(exchangeContext)}>
        <Image src={spCoin_png} className={styles.logoImg} width={30} height={30} alt="SponsorCoin Logo" />
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
          alt="Info Image"
          onClick={toggleSponsorRateConfig}
        />
      </div>
    </div>
  );
};

export default RecipientSelectHeader;
