import styles from '@/styles/Exchange.module.css';
import { ArrowDownOutlined } from "@ant-design/icons";

const BuySellSwapArrowButton = ({swapBuySellTokens} : { swapBuySellTokens:() => void }) => {
  return (
    <div className={styles.switchButton}>
      <ArrowDownOutlined className={styles.switchArrow} onClick={() => swapBuySellTokens()}/>
    </div>
  );
}

export default BuySellSwapArrowButton;
