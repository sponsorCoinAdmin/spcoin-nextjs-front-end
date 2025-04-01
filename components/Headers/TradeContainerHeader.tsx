import styles from '@/styles/Exchange.module.css';
import { SettingOutlined } from "@ant-design/icons";
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigDialog from '../Dialogs/Popup/ConfigDialog';
import { openDialog } from '../Dialogs/Dialogs';
import { exchangeContextDump } from '@/lib/spCoin/utils';
import { useExchangeContext, useSlippageBps } from "@/lib/context/contextHooks";

const TradeContainerHeader = () => {
  const [slippageBps, setSlippageBps] = useSlippageBps();
  const { exchangeContext } = useExchangeContext();
  return (
    <div className={styles.tradeContainerHeader}>
      <ConfigDialog  showDialog={false}/>
      <div  onClick={() => exchangeContextDump(exchangeContext)}>
        <Image src={spCoin_png} className={styles.avatarImg} width={30} height={30} alt="SponsorCoin Logo" />
      </div>

      <h4 className={styles.center}>Sponsor Coin Exchange</h4>
      <dialog  title="Settings" >
        <SettingOutlined className={styles.cog} />
      </dialog>
      <div>
        <Image src={cog_png} className={styles["cogImg2"]} width={20} height={20} alt="Info Image"  
            onClick={() => openDialog("#configDialog")}/>
      </div>
      {/* 
      <Popover content={<slippageBps initialSlippageBps={slippageBps} setSlippageBpsCallback={setSlippageBpsCallback}/>} title="Settings" trigger="click" placement="bottomLeft">
        <SettingOutlined className={styles.cog} />
      </Popover>
    */}
    </div>
  );
}

export default TradeContainerHeader;
