import styles from '@/styles/Exchange.module.css';
import { SettingOutlined } from "@ant-design/icons";
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigDialog from '../Dialogs/ConfigDialog';
import { openDialog } from '../Dialogs/Dialogs';
import { exchangeContextDump } from '@/lib/spCoin/utils';
import { toggleElement, toggleSponsorRateConfig } from '@/lib/spCoin/guiControl';
import { useExchangeContext } from '@/lib/context/contextHooks'

const RecipientSelectHeader = ({slippageBps, setSlippageBpsCallback, closeDialog}:any) => {
  const { exchangeContext } = useExchangeContext();
  return (
    <div className={styles.tradeContainerHeader}>
      <ConfigDialog slippageBps={slippageBps} setSlippageBpsCallback={setSlippageBpsCallback} showDialog={false}/>
      <div  onClick={() => exchangeContextDump(exchangeContext)}>
        <Image src={spCoin_png} className={styles.avatarImg} width={30} height={30} alt="SponsorCoin Logo" />
      </div>

      <h4 className={styles.center}>Sponsor Recipient Selection</h4>
      <dialog  title="Settings" >
        <SettingOutlined className={styles.cog} />
      </dialog>
      <div>
        {/* <div className={styles["XClose"]}  onClick={closeDialog}>
          X 
        </div> */}
        <div>
          <Image src={cog_png} className={styles["cogImg2"]} width={20} height={20} alt="Info Image"  
              onClick={() => toggleSponsorRateConfig("SponsorRateConfig_ID", exchangeContext)}/>
        </div>
      </div>
    </div>
  );
}

export default RecipientSelectHeader;
