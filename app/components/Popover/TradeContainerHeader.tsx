import styles from '@/app/styles/Exchange.module.css';
import { Popover } from 'antd';
import Slippage from './Slippage';
import { SettingOutlined } from "@ant-design/icons";
import Image from 'next/image';
import spCoin_png from '../../../public/resources/images/spCoin.png';
import cog_png from '../../../public/resources/images/miscellaneous/cog.png';
import ConfigDialog from '../Dialogs/ConfigDialog';
import { openDialog } from '../Dialogs/Dialogs';
import { exchangeDataDump } from '@/app/lib/spCoin/utils';

const TradeContainerHeader = ({slippage, setSlippageCallback}:any) => {
  return (
    <div className={styles.tradeContainerHeader}>
      <ConfigDialog initialSlippage={slippage} setSlippageCallback={setSlippageCallback}/>
      <div  onClick={() => exchangeDataDump()}>
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
      <Popover content={<Slippage initialSlippage={slippage} setSlippageCallback={setSlippageCallback}/>} title="Settings" trigger="click" placement="bottomLeft">
        <SettingOutlined className={styles.cog} />
      </Popover>
    */}
    </div>
  );
}

export default TradeContainerHeader;
