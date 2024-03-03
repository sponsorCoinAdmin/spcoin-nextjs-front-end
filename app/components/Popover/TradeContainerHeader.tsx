import styles from '../../styles/Exchange.module.css';
import { Popover } from 'antd';
import Slippage from './Slippage';
import { SettingOutlined } from "@ant-design/icons";
import Image from 'next/image';
import spCoin_png from '../../../public/resources/images/spCoin.png';

const TradeContainerHeader = ({slippage, setSlippageCallback}:any) => {
  return (
    <div className={styles.tradeContainerHeader}>
    <Image src={spCoin_png} className={styles.avatarImg} width={30} height={30} alt="SponsorCoin Logo" />
    <h4 className={styles.center}>Sponsor Coin Exchange</h4>
    <Popover content={<Slippage initialSlippage={slippage} setSlippageCallback={setSlippageCallback}/>} title="Settings" trigger="click" placement="bottomLeft">
      <SettingOutlined className={styles.cog} />
    </Popover>
  </div>
);
}

export default TradeContainerHeader;
