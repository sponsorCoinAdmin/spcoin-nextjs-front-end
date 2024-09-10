import styles from '@/styles/Exchange.module.css';
import { SettingOutlined } from "@ant-design/icons";
import Image from 'next/image';
import spCoin_png from '../../public/resources/images/spCoin.png';
import cog_png from '../../public/resources/images/miscellaneous/cog.png';
import ConfigDialog from '../Dialogs/ConfigDialog';
import { openDialog } from '../Dialogs/Dialogs';
import { exchangeContextDump } from '@/lib/spCoin/utils';

const RecipientSelectHeader = ({slippage, setSlippageCallback, closeDialog}:any) => {
  return (
    <div className={styles.tradeContainerHeader}>
      <ConfigDialog slippage={slippage} setSlippageCallback={setSlippageCallback} showDialog={false}/>
      <div  onClick={() => exchangeContextDump()}>
        <Image src={spCoin_png} className={styles.avatarImg} width={30} height={30} alt="SponsorCoin Logo" />
      </div>

      <h4 className={styles.center}>Sponsor Recipient Selection</h4>
      <dialog  title="Settings" >
        <SettingOutlined className={styles.cog} />
      </dialog>
      <div className={styles["XClose"]}  onClick={closeDialog}>
        X 
      </div>
    </div>
  );
}

export default RecipientSelectHeader;
