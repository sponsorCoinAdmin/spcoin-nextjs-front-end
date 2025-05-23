import styles from '@/styles/Exchange.module.css';
import { SettingOutlined } from "@ant-design/icons";
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import ConfigDialog from '@/components/Dialogs/Dialogs/Popup/ConfigDialog';
import { openDialog } from '@/components/Dialogs/Dialogs';
import { exchangeContextDump } from '@/lib/spCoin/guiUtils';
import { useExchangeContext } from '@/lib/context/contextHooks'
import { SP_COIN_DISPLAY } from '@/lib/structure/types';
import { useSpCoinDisplay } from '@/lib/context/contextHooks';

const RecipientSelectHeader = ({slippageBps, closeDialog}:any) => {
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();
  const { exchangeContext } = useExchangeContext();

  const toggleSponsorRateConfig = () => {
    if(spCoinDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER) {
      alert("Sponsor Rate Config spCoinDisplay is set to SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER")
      setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG);
    }
    else {
      alert("Sponsor Rate Config spCoinDisplay is set to SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG")
      setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER)
    }
  };

  return (
    <div className={styles.tradeContainerHeader}>
      <ConfigDialog showDialog={false}/>
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
            onClick={() => toggleSponsorRateConfig()}/>
        </div>
      </div>
    </div>
  );
}

export default RecipientSelectHeader;
