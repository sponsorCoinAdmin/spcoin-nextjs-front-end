'use client';

import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useSpCoinDisplay } from '@/lib/context/hooks';
import { RecipientSelectContainer } from '../containers/AssetSelectPanel';

const AddSponsorshipButton = () => {
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  const isContainerVisible =
    spCoinDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG ||
    spCoinDisplay === SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG;

  return (
    <>
      <div
        className={styles.addSponsorshipDiv}
        onClick={() => setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG)}
      >
        <div className={styles.centerTop}>Add</div>
        <div className={styles.centerBottom}>Sponsorship</div>
      </div>

      {isContainerVisible && <RecipientSelectContainer />}
    </>
  );
};

export default AddSponsorshipButton;
