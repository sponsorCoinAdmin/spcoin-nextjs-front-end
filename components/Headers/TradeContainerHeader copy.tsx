import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigDialog from '@/components/Dialogs/Popup/ConfigDialog';
import { openDialog } from '@/components/Dialogs/Dialogs';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useExchangeContext } from '@/lib/context/hooks';

const TradeContainerHeader = () => {
  const { exchangeContext } = useExchangeContext();

  return (
    <div className={styles.tradeContainerHeader}>
      <ConfigDialog showDialog={false} />

      <div onClick={() => exchangeContextDump(exchangeContext)}>
        <Image
          src={spCoin_png}
          className={styles.logoImg}
          alt="SponsorCoin Logo"
          style={{ height: 'auto', width: 'auto' }} // ✅ add this
        />      </div>

      <h4 className={styles.center}>Sponsor Coin Exchange</h4>

      <div>
        <Image
          src={cog_png}
          alt="Info Image"
          onClick={() => openDialog('#ConfigDialog')}
          className={styles.cogImg2}
          style={{ height: 'au20to', width: 'auto' }} // ✅ required
        />      
      </div>
    </div>
  );
};

export default TradeContainerHeader;
