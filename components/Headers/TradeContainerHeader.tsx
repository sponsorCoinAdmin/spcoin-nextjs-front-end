import styles from '@/styles/Exchange.module.css';
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigDialog from '@/components/Dialogs/Popup/ConfigDialog';
import { openDialog } from '@/components/Dialogs/Dialogs';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useExchangeContext } from '@/lib/context/hooks/contextHooks';
import { Settings } from 'lucide-react'; // replaces AntD icon

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

      {/* <div>
        <Settings size={20} className={styles.cog} />
      </div> */}

      <div>
        <Image
          src={cog_png}
          alt="Info Image"
          onClick={() => openDialog('#ConfigDialog')}
          className={styles.cogImg2}
          style={{ height: 'au20to', width: 'auto' }} // ✅ required
        />      
      </div>
      {/* 
      <Popover content={<slippageBps initialSlippageBps={slippageBps} setSlippageBpsCallback={setSlippageBpsCallback}/>} title="Settings" trigger="click" placement="bottomLeft">
        <SettingOutlined className={styles.cog} />
      </Popover>
      */}
    </div>
  );
};

export default TradeContainerHeader;
